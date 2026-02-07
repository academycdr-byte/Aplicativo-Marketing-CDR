'use client';

import { useEffect, useState } from 'react';
import StatsCard from '@/components/StatsCard';
import { Eye, DollarSign, FileVideo, Users, TrendingUp, Instagram } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardData {
  total_visualizacoes: number;
  total_comissoes: number;
  total_postagens: number;
  total_colaboradores: number;
  comissoes_pendentes: number;
  comissoes_pagas: number;
  postagens_por_mes: { mes: string; quantidade: number }[];
  comissoes_por_colaborador: { nome: string; valor: number }[];
  visualizacoes_por_plataforma: { plataforma: string; visualizacoes: number }[];
  top_postagens: {
    id: number; titulo: string; visualizacoes: number;
    categoria: string; conta_plataforma: string; colaborador_nome: string;
  }[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#06b6d4'];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function formatMonth(mes: string): string {
  const [year, month] = mes.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(month) - 1]}/${year.slice(2)}`;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="h-80 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const postagensMesData = [...data.postagens_por_mes].reverse().map(item => ({
    ...item,
    mes: formatMonth(item.mes),
  }));

  const pieData = [
    { name: 'Pendentes', value: data.comissoes_pendentes },
    { name: 'Pagas', value: data.comissoes_pagas },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Visao geral do marketing CDR</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Visualizacoes"
          value={formatNumber(data.total_visualizacoes)}
          icon={Eye}
          color="blue"
        />
        <StatsCard
          title="Total em Comissoes"
          value={formatCurrency(data.total_comissoes)}
          subtitle={`${formatCurrency(data.comissoes_pendentes)} pendentes`}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Total de Postagens"
          value={formatNumber(data.total_postagens)}
          icon={FileVideo}
          color="purple"
        />
        <StatsCard
          title="Colaboradores Ativos"
          value={data.total_colaboradores}
          icon={Users}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart - Postagens por Mes */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Postagens por Mes</h3>
          {postagensMesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={postagensMesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  formatter={(value: number) => [value, 'Postagens']}
                />
                <Bar dataKey="quantidade" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              Nenhuma postagem registrada ainda
            </div>
          )}
        </div>

        {/* Pie Chart - Comissoes Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status das Comissoes</h3>
          {pieData.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#f59e0b" />
                    <Cell fill="#22c55e" />
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-gray-600">Pendentes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600">Pagas</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-400">
              Nenhuma comissao registrada
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Postagens */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Postagens</h3>
          {data.top_postagens.length > 0 ? (
            <div className="space-y-3">
              {data.top_postagens.map((post, idx) => (
                <div key={post.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-lg font-bold text-gray-300 w-6">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{post.titulo}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        post.categoria === 'viral' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {post.categoria === 'viral' ? 'Viral' : 'Tecnico'}
                      </span>
                      <span className="text-xs text-gray-400">{post.conta_plataforma}</span>
                      <span className="text-xs text-gray-400">por {post.colaborador_nome}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatNumber(post.visualizacoes)}</p>
                    <p className="text-xs text-gray-400">views</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400">
              Nenhuma postagem registrada
            </div>
          )}
        </div>

        {/* Comissoes por Colaborador */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Comissoes por Colaborador</h3>
          {data.comissoes_por_colaborador.length > 0 ? (
            <div className="space-y-3">
              {data.comissoes_por_colaborador.map((item, idx) => {
                const maxValue = data.comissoes_por_colaborador[0]?.valor || 1;
                const percentage = maxValue > 0 ? (item.valor / maxValue) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{item.nome}</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.valor)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400">
              Nenhum colaborador registrado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
