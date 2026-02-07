'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Calculator, Check, X, Filter, Download, Users, Eye, Calendar } from 'lucide-react';
import EmptyState from '@/components/EmptyState';

interface Comissao {
  id: number;
  colaborador_id: number;
  postagem_id: number;
  valor: number;
  mes_referencia: string;
  pago: number;
  data_pagamento: string | null;
  colaborador_nome: string;
  postagem_titulo: string;
  postagem_visualizacoes: number;
  postagem_categoria: string;
  conta_plataforma: string;
}

interface Colaborador { id: number; nome: string; }

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(mes: string): string {
  const [year, month] = mes.split('-');
  const months = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${months[parseInt(month) - 1]} ${year}`;
}

export default function ComissoesPage() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [mesSelecionado, setMesSelecionado] = useState(getCurrentMonth());
  const [filterColaborador, setFilterColaborador] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchComissoes = async () => {
    try {
      const params = new URLSearchParams();
      if (mesSelecionado) params.set('mes', mesSelecionado);
      if (filterColaborador) params.set('colaborador_id', filterColaborador);
      if (filterStatus) params.set('pago', filterStatus);

      const [comRes, colabRes] = await Promise.all([
        fetch(`/api/comissoes?${params}`).then(r => r.ok ? r.json() : []),
        fetch('/api/colaboradores').then(r => r.ok ? r.json() : []),
      ]);
      if (Array.isArray(comRes)) setComissoes(comRes);
      if (Array.isArray(colabRes)) setColaboradores(colabRes);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchComissoes(); }, [mesSelecionado, filterColaborador, filterStatus]);

  const handleCalcular = async () => {
    setCalculating(true);
    await fetch('/api/comissoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'calcular', mes: mesSelecionado }),
    });
    setCalculating(false);
    fetchComissoes();
  };

  const handleTogglePago = async (comissao: Comissao) => {
    await fetch('/api/comissoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: comissao.pago ? 'marcar_nao_pago' : 'marcar_pago',
        id: comissao.id,
      }),
    });
    fetchComissoes();
  };

  const totalComissoes = comissoes.reduce((acc, c) => acc + c.valor, 0);
  const totalPago = comissoes.filter(c => c.pago).reduce((acc, c) => acc + c.valor, 0);
  const totalPendente = comissoes.filter(c => !c.pago).reduce((acc, c) => acc + c.valor, 0);

  // Group by collaborator
  const comissoesPorColaborador: Record<string, { nome: string; total: number; pago: number; pendente: number; items: Comissao[] }> = {};
  comissoes.forEach(c => {
    if (!comissoesPorColaborador[c.colaborador_nome]) {
      comissoesPorColaborador[c.colaborador_nome] = { nome: c.colaborador_nome, total: 0, pago: 0, pendente: 0, items: [] };
    }
    comissoesPorColaborador[c.colaborador_nome].total += c.valor;
    if (c.pago) comissoesPorColaborador[c.colaborador_nome].pago += c.valor;
    else comissoesPorColaborador[c.colaborador_nome].pendente += c.valor;
    comissoesPorColaborador[c.colaborador_nome].items.push(c);
  });

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comissoes</h1>
          <p className="text-gray-500 mt-1">Calcule e gerencie as comissoes dos colaboradores</p>
        </div>
        <button
          onClick={handleCalcular}
          disabled={calculating}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
        >
          <Calculator className="w-4 h-4" />
          {calculating ? 'Calculando...' : 'Calcular Comissoes'}
        </button>
      </div>

      {/* Month Selector & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="month"
            value={mesSelecionado}
            onChange={e => setMesSelecionado(e.target.value)}
            className="text-sm focus:outline-none"
          />
        </div>
        <select
          value={filterColaborador}
          onChange={e => setFilterColaborador(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todos colaboradores</option>
          {colaboradores.map(c => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todos status</option>
          <option value="false">Pendentes</option>
          <option value="true">Pagas</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total do Mes</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalComissoes)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Pendente</p>
              <p className="text-xl font-bold text-amber-600">{formatCurrency(totalPendente)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Pago</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalPago)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Commission List */}
      {comissoes.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="Nenhuma comissao para este mes"
          description={`Clique em "Calcular Comissoes" para gerar as comissoes de ${formatMonthLabel(mesSelecionado)} com base nas postagens registradas.`}
          action={{ label: 'Calcular Comissoes', onClick: handleCalcular }}
        />
      ) : (
        <div className="space-y-6">
          {Object.values(comissoesPorColaborador).map(grupo => (
            <div key={grupo.nome} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Collaborator Header */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-bold">{grupo.nome.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{grupo.nome}</h3>
                      <p className="text-xs text-gray-500">{grupo.items.length} postagen{grupo.items.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(grupo.total)}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {grupo.pendente > 0 && (
                        <span className="text-xs text-amber-600">{formatCurrency(grupo.pendente)} pendente</span>
                      )}
                      {grupo.pago > 0 && (
                        <span className="text-xs text-green-600">{formatCurrency(grupo.pago)} pago</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Commission Items */}
              <div className="divide-y divide-gray-50">
                {grupo.items.map(comissao => (
                  <div key={comissao.id} className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{comissao.postagem_titulo}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          comissao.postagem_categoria === 'viral'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {comissao.postagem_categoria === 'viral' ? 'Viral' : 'Tecnico'}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatNumber(comissao.postagem_visualizacoes)} views
                        </span>
                        <span className="text-xs text-gray-400">{comissao.conta_plataforma}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(comissao.valor)}</p>
                    </div>
                    <button
                      onClick={() => handleTogglePago(comissao)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                        comissao.pago
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700'
                      }`}
                    >
                      {comissao.pago ? (
                        <><Check className="w-3.5 h-3.5" /> Pago</>
                      ) : (
                        <><DollarSign className="w-3.5 h-3.5" /> Marcar Pago</>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
