'use client';

import { useEffect, useState, useMemo } from 'react';
import { DollarSign, Check, Clock, ChevronDown, ChevronRight, Users, Calculator, Search } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import Badge from '@/components/Badge';
import Avatar from '@/components/Avatar';
import StatsCard from '@/components/StatsCard';
import { SkeletonStats, SkeletonTable } from '@/components/Skeleton';
import { useToast } from '@/components/ToastProvider';
import { formatCurrency, formatMonth, formatNumber, getCurrentMonth, cn } from '@/lib/utils';

interface Comissao {
  id: number; colaborador_id: number; colaborador_nome: string; postagem_id: number; postagem_titulo: string;
  postagem_visualizacoes: number; postagem_categoria: string; valor: number; mes_referencia: string; pago: boolean;
  conta_plataforma: string;
}

export default function ComissoesPage() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState(getCurrentMonth());
  const [expandedColab, setExpandedColab] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  const fetchComissoes = async () => {
    try {
      const res = await fetch(`/api/comissoes?mes=${mesAtual}`);
      const data = await res.json();
      if (Array.isArray(data)) setComissoes(data);
    } catch { showToast('error', 'Erro ao carregar comissoes'); }
    finally { setLoading(false); }
  };

  const calcularComissoes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/comissoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'calcular', mes: mesAtual }) });
      const data = await res.json();
      if (res.ok) { showToast('success', `${Array.isArray(data) ? data.length : 0} comissoes calculadas!`); fetchComissoes(); }
      else showToast('error', data.error || 'Erro ao calcular');
    } catch { showToast('error', 'Erro ao calcular comissoes'); }
    setLoading(false);
  };

  const togglePago = async (comissao: Comissao) => {
    try {
      const action = comissao.pago ? 'marcar_nao_pago' : 'marcar_pago';
      await fetch('/api/comissoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, id: comissao.id }) });
      showToast('success', comissao.pago ? 'Marcada como pendente' : 'Marcada como paga');
      fetchComissoes();
    } catch { showToast('error', 'Erro ao atualizar status'); }
  };

  const pagarTodas = async (colaboradorId: number) => {
    const pendentes = comissoes.filter(c => c.colaborador_id === colaboradorId && !c.pago);
    for (const c of pendentes) {
      await fetch('/api/comissoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'marcar_pago', id: c.id }) });
    }
    showToast('success', `${pendentes.length} comissoes marcadas como pagas`);
    fetchComissoes();
  };

  useEffect(() => { fetchComissoes(); }, [mesAtual]);

  const totais = useMemo(() => {
    const total = comissoes.reduce((s, c) => s + (c.valor || 0), 0);
    const pagas = comissoes.reduce((s, c) => s + (c.pago ? (c.valor || 0) : 0), 0);
    const pendentes = total - pagas;
    return { total, pagas, pendentes, count: comissoes.length };
  }, [comissoes]);

  // Group by collaborator
  const grouped = useMemo(() => {
    const map = new Map<number, { nome: string; comissoes: Comissao[]; total: number; pagas: number }>();
    comissoes.forEach(c => {
      if (!map.has(c.colaborador_id)) map.set(c.colaborador_id, { nome: c.colaborador_nome, comissoes: [], total: 0, pagas: 0 });
      const grp = map.get(c.colaborador_id)!;
      grp.comissoes.push(c);
      grp.total += (c.valor || 0);
      if (c.pago) grp.pagas += (c.valor || 0);
    });
    let result = Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
    if (search) result = result.filter(([, g]) => g.nome.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [comissoes, search]);

  const toggleExpand = (id: number) => {
    setExpandedColab(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const pctPago = totais.total > 0 ? Math.round((totais.pagas / totais.total) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Comissoes" subtitle={`Referencia: ${formatMonth(mesAtual)}`}
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <input type="month" className="input w-auto" value={mesAtual} onChange={e => setMesAtual(e.target.value)} />
            <button onClick={calcularComissoes} className="btn-accent flex items-center gap-2" disabled={loading}>
              <Calculator className="w-4 h-4" /> Calcular
            </button>
          </div>
        }
      />

      {/* Summary */}
      {loading ? <SkeletonStats /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <StatsCard title="Total" value={formatCurrency(totais.total)} subtitle={`${totais.count} comissoes`} icon={DollarSign} />
          <StatsCard title="Pagas" value={formatCurrency(totais.pagas)} icon={Check} />
          <StatsCard title="Pendentes" value={formatCurrency(totais.pendentes)} icon={Clock} />
          <div className="card p-5 animate-fade-in">
            <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">Progresso</p>
            <p className="text-2xl font-bold mt-2 text-text-primary">{pctPago}%</p>
            <div className="w-full rounded-full h-2 mt-3 bg-bg-hover">
              <div className="h-2 rounded-full transition-all duration-700 bg-accent" style={{ width: `${pctPago}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input className="input pl-10" placeholder="Buscar colaborador..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Accordion */}
      {loading ? <SkeletonTable /> : grouped.length === 0 ? (
        <EmptyState icon={DollarSign} title="Nenhuma comissao" description="Calcule as comissoes do mes selecionado."
          action={{ label: 'Calcular Comissoes', onClick: calcularComissoes }} />
      ) : (
        <div className="space-y-3 stagger-children">
          {grouped.map(([colabId, grp]) => {
            const expanded = expandedColab.has(colabId);
            const pctGrp = grp.total > 0 ? Math.round((grp.pagas / grp.total) * 100) : 0;
            const pendentes = grp.comissoes.filter(c => !c.pago).length;
            return (
              <div key={colabId} className="card overflow-hidden animate-fade-in">
                {/* Header */}
                <button onClick={() => toggleExpand(colabId)} className="w-full flex items-center gap-4 p-4 transition-colors text-left hover:bg-bg-hover">
                  {expanded
                    ? <ChevronDown className="w-4 h-4 shrink-0 text-text-tertiary" />
                    : <ChevronRight className="w-4 h-4 shrink-0 text-text-tertiary" />
                  }
                  <Avatar name={grp.nome} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">{grp.nome}</span>
                      {pendentes > 0 && <Badge variant="warning">{pendentes} pendente{pendentes > 1 ? 's' : ''}</Badge>}
                      {pendentes === 0 && grp.comissoes.length > 0 && <Badge variant="success">Tudo pago</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 max-w-[120px] rounded-full h-1.5 bg-bg-hover">
                        <div className="h-1.5 rounded-full transition-all bg-accent" style={{ width: `${pctGrp}%` }} />
                      </div>
                      <span className="text-xs text-text-tertiary">{pctGrp}%</span>
                    </div>
                  </div>
                  <span className="text-base font-bold shrink-0 text-accent">{formatCurrency(grp.total)}</span>
                </button>
                {/* Items */}
                {expanded && (
                  <div className="border-t border-border-default">
                    {pendentes > 0 && (
                      <div className="px-4 py-2 flex justify-end bg-bg-hover">
                        <button onClick={() => pagarTodas(colabId)} className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors text-accent bg-accent-surface hover:bg-accent-surface-hover">
                          Pagar todas ({pendentes})
                        </button>
                      </div>
                    )}
                    {grp.comissoes.map(c => (
                      <div key={c.id} className="flex items-center gap-3 px-4 py-3 transition-colors border-b border-border-default hover:bg-bg-hover">
                        <button onClick={() => togglePago(c)}
                          className={cn(
                            'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                            c.pago
                              ? 'border-accent bg-accent'
                              : 'border-border-default bg-transparent'
                          )}>
                          {c.pago && <Check className="w-3 h-3 text-text-inverted" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm truncate',
                            c.pago ? 'text-text-tertiary line-through' : 'text-text-primary'
                          )}>
                            {c.postagem_titulo}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant={c.postagem_categoria === 'viral' ? 'viral' : 'tecnico'} size="sm">{c.postagem_categoria === 'viral' ? 'Viral' : 'Tecnico'}</Badge>
                            <span className="text-[11px] text-text-tertiary">
                              {formatNumber(c.postagem_visualizacoes)} views
                            </span>
                          </div>
                        </div>
                        <span className={cn(
                          'text-sm font-bold shrink-0',
                          c.pago ? 'text-text-tertiary' : 'text-text-primary'
                        )}>
                          {formatCurrency(c.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
