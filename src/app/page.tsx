'use client';

import { useEffect, useState, useCallback } from 'react';
import StatsCard from '@/components/StatsCard';
import { SkeletonStats, SkeletonChart } from '@/components/Skeleton';
import Badge from '@/components/Badge';
import Avatar from '@/components/Avatar';
import { SegmentedControl } from '@/components/ui';
import { Eye, DollarSign, FileVideo, Users, TrendingUp, BarChart3, Calendar, Instagram, Music2, Store, ShoppingCart, Package, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatNumber, formatCompactNumber, formatMonth, getGreeting, formatFullDate, getEngagementRate, cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

interface ShopifyDashboardData {
  total_receita: number;
  total_pedidos: number;
  ticket_medio: number;
  total_produtos: number;
  total_clientes: number;
  pedidos_por_mes: { mes: string; quantidade: number; receita: number }[];
  top_produtos: { titulo: string; quantidade_vendida: number; receita: number }[];
  pedidos_por_status: { status: string; quantidade: number }[];
  clientes_por_cidade: { cidade: string; quantidade: number }[];
  receita_por_loja: { nome_loja: string; dominio: string; receita: number; pedidos: number }[];
  produtos_baixo_estoque: { id: number; titulo: string; estoque_total: number; loja_nome: string; preco_min: number }[];
}

type DashboardTab = 'social' | 'ecommerce';

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
    curtidas?: number; comentarios?: number; compartilhamentos?: number;
    categoria: string; conta_plataforma: string; conta_nome: string; conta_username: string; colaborador_nome: string;
  }[];
  postagens_por_plataforma: { plataforma: string; quantidade: number; visualizacoes: number }[];
  postagens_por_perfil: { nome_perfil: string; username: string; plataforma: string; quantidade: number; visualizacoes: number }[];
  comissoes_por_plataforma: { plataforma: string; valor: number; quantidade: number }[];
  comissoes_por_perfil: { nome_perfil: string; username: string; plataforma: string; valor: number; quantidade: number }[];
}

type Preset = '7d' | '30d' | '90d' | 'year' | 'all';

function getPresetDates(preset: Preset): { inicio: string; fim: string } | null {
  if (preset === 'all') return null;
  const now = new Date();
  const fim = now.toISOString().split('T')[0];
  const start = new Date(now);
  if (preset === '7d') start.setDate(start.getDate() - 7);
  else if (preset === '30d') start.setDate(start.getDate() - 30);
  else if (preset === '90d') start.setDate(start.getDate() - 90);
  else if (preset === 'year') start.setFullYear(start.getFullYear() - 1);
  return { inicio: start.toISOString().split('T')[0], fim };
}

const presets: { key: Preset; label: string }[] = [
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: '90d', label: '90 dias' },
  { key: 'year', label: '1 ano' },
  { key: 'all', label: 'Tudo' },
];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [shopifyData, setShopifyData] = useState<ShopifyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopifyLoading, setShopifyLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('social');
  const [activePreset, setActivePreset] = useState<Preset>('all');
  const [customInicio, setCustomInicio] = useState('');
  const [customFim, setCustomFim] = useState('');
  const [topFilterPlataforma, setTopFilterPlataforma] = useState<string>('all');
  const [topFilterPerfil, setTopFilterPerfil] = useState<string>('all');

  const fetchData = useCallback((inicio?: string, fim?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (inicio) params.set('inicio', inicio);
    if (fim) params.set('fim', fim);
    const qs = params.toString();
    fetch(`/api/dashboard${qs ? `?${qs}` : ''}`)
      .then(res => { if (!res.ok) throw new Error('Erro'); return res.json(); })
      .then(d => {
        if (d && typeof d.total_postagens === 'number') setData(d);
        else throw new Error('Dados invalidos');
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const fetchShopifyData = useCallback((inicio?: string, fim?: string) => {
    setShopifyLoading(true);
    const params = new URLSearchParams();
    if (inicio) params.set('inicio', inicio);
    if (fim) params.set('fim', fim);
    const qs = params.toString();
    fetch(`/api/shopify/dashboard${qs ? `?${qs}` : ''}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(d => setShopifyData(d))
      .catch(() => setShopifyData(null))
      .finally(() => setShopifyLoading(false));
  }, []);

  useEffect(() => { fetchData(); fetchShopifyData(); }, [fetchData, fetchShopifyData]);

  const handlePreset = (preset: Preset) => {
    setActivePreset(preset);
    setCustomInicio('');
    setCustomFim('');
    const dates = getPresetDates(preset);
    if (dates) { fetchData(dates.inicio, dates.fim); fetchShopifyData(dates.inicio, dates.fim); }
    else { fetchData(); fetchShopifyData(); }
  };

  const handleCustomDates = () => {
    if (customInicio || customFim) {
      setActivePreset('all'); // deselect presets
      fetchData(customInicio || undefined, customFim || undefined);
      fetchShopifyData(customInicio || undefined, customFim || undefined);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-1">
          <div className="skeleton w-[200px] h-[28px]" />
          <div className="skeleton w-[280px] h-[16px]" />
        </div>
        <SkeletonStats />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><SkeletonChart /></div>
          <SkeletonChart />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-error-surface">
          <BarChart3 className="w-7 h-7 text-error" />
        </div>
        <p className="text-lg font-semibold mb-1 text-text-primary">Erro ao carregar dashboard</p>
        <p className="text-sm mb-4 text-text-secondary">Verifique a conexao com o banco de dados.</p>
        <button onClick={() => window.location.reload()} className="btn-accent">Tentar novamente</button>
      </div>
    );
  }

  const postagensMesData = [...(data.postagens_por_mes || [])].reverse().map(item => ({
    ...item,
    mes: formatMonth(item.mes),
  }));

  const pieData = [
    { name: 'Pendentes', value: data.comissoes_pendentes },
    { name: 'Pagas', value: data.comissoes_pagas },
  ].filter(d => d.value > 0);

  const totalComissoes = data.comissoes_pendentes + data.comissoes_pagas;
  const pagoPct = totalComissoes > 0 ? Math.round((data.comissoes_pagas / totalComissoes) * 100) : 0;

  const avgViews = data.total_postagens > 0 ? Math.round(data.total_visualizacoes / data.total_postagens) : 0;

  const isPresetActive = (key: Preset) => activePreset === key && !customInicio && !customFim;

  return (
    <div className={cn('space-y-6 md:space-y-8 animate-fade-in transition-opacity duration-300', loading && 'opacity-60 pointer-events-none')}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
            {getGreeting()}, Admin
          </h1>
          <p className="text-sm mt-1 text-text-secondary">
            {formatFullDate()}
          </p>
        </div>
      </div>

      {/* Date Selector */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-1.5 shrink-0">
            <Calendar className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-text-secondary">Periodo:</span>
          </div>
          {/* Presets */}
          <div className="flex items-center gap-1 p-1 rounded-xl flex-wrap bg-bg-hover">
            {presets.map(p => (
              <button key={p.key} onClick={() => handlePreset(p.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  isPresetActive(p.key)
                    ? 'bg-bg-card text-text-primary shadow-[var(--shadow-sm)]'
                    : 'bg-transparent text-text-tertiary hover:text-text-secondary'
                )}>
                {p.label}
              </button>
            ))}
          </div>
          {/* Custom */}
          <div className="flex items-center gap-2 flex-wrap">
            <input type="date" className="input text-xs w-auto px-2.5 py-1.5"
              value={customInicio} onChange={e => setCustomInicio(e.target.value)} />
            <span className="text-xs text-text-tertiary">ate</span>
            <input type="date" className="input text-xs w-auto px-2.5 py-1.5"
              value={customFim} onChange={e => setCustomFim(e.target.value)} />
            <button onClick={handleCustomDates} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-accent-surface text-accent hover:bg-accent-surface-hover">
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <SegmentedControl
        options={[
          { value: 'social' as DashboardTab, label: 'Social Media', icon: Instagram },
          { value: 'ecommerce' as DashboardTab, label: 'E-commerce', icon: Store },
        ]}
        value={activeTab}
        onChange={(val) => setActiveTab(val as DashboardTab)}
      />

      {/* ==================== SOCIAL MEDIA TAB ==================== */}
      {activeTab === 'social' && (<>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 stagger-children">
        <StatsCard
          title="Total de Visualizacoes"
          value={formatCompactNumber(data.total_visualizacoes)}
          subtitle={`${formatNumber(data.total_visualizacoes)} views`}
          icon={Eye}
        />
        <StatsCard
          title="Total em Comissoes"
          value={formatCurrency(data.total_comissoes)}
          subtitle={`${formatCurrency(data.comissoes_pendentes)} pendentes`}
          icon={DollarSign}
        />
        <StatsCard
          title="Total de Postagens"
          value={formatNumber(data.total_postagens)}
          subtitle={`Media de ${formatCompactNumber(avgViews)} views/post`}
          icon={FileVideo}
        />
        <StatsCard
          title="Colaboradores Ativos"
          value={data.total_colaboradores}
          icon={Users}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 card p-5 md:p-6">
          <h3 className="text-base font-semibold mb-4 text-text-primary">
            Postagens por Mes
          </h3>
          {postagensMesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={postagensMesData}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-lg)',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(value: number) => [value, 'Postagens']}
                />
                <Area
                  type="monotone"
                  dataKey="quantidade"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="url(#areaGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-text-tertiary">
              Nenhuma postagem registrada ainda
            </div>
          )}
        </div>

        {/* Donut Chart */}
        <div className="card p-5 md:p-6">
          <h3 className="text-base font-semibold mb-4 text-text-primary">
            Status das Comissoes
          </h3>
          {pieData.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    <Cell fill="var(--warning)" />
                    <Cell fill="var(--success)" />
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="text-center -mt-4 mb-3">
                <p className="text-2xl font-bold text-text-primary">{pagoPct}%</p>
                <p className="text-xs text-text-tertiary">pago</p>
              </div>
              <div className="flex justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-warning" />
                  <span className="text-xs text-text-secondary">Pendentes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-success" />
                  <span className="text-xs text-text-secondary">Pagas</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-text-tertiary">
              Nenhuma comissao registrada
            </div>
          )}
        </div>
      </div>

      {/* Platform Performance */}
      {(data.visualizacoes_por_plataforma || []).length > 0 && (
        <div className="card p-5 md:p-6">
          <h3 className="text-base font-semibold mb-4 text-text-primary">
            Performance por Plataforma
          </h3>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={data.visualizacoes_por_plataforma} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="plataforma" tick={{ fontSize: 12 }} width={80} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                formatter={(value: number) => [formatNumber(value), 'Visualizacoes']}
              />
              <Bar dataKey="visualizacoes" fill="var(--accent)" radius={[0, 6, 6, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Posts by Platform & Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Posts by Platform */}
        <div className="card p-5 md:p-6">
          <h3 className="text-base font-semibold mb-4 text-text-primary">
            Postagens por Rede
          </h3>
          {(data.postagens_por_plataforma || []).length > 0 ? (
            <div className="space-y-4">
              {(data.postagens_por_plataforma || []).map((item) => {
                const maxQtd = Math.max(...(data.postagens_por_plataforma || []).map(p => p.quantidade), 1);
                const pct = (item.quantidade / maxQtd) * 100;
                const isInsta = item.plataforma?.toLowerCase() === 'instagram';
                return (
                  <div key={item.plataforma} className="animate-fade-in">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                        isInsta ? 'bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]' : 'bg-[#010101]'
                      )}>
                        {isInsta
                          ? <Instagram className="w-4.5 h-4.5 text-white" />
                          : <Music2 className="w-4.5 h-4.5 text-white" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold capitalize text-text-primary">{item.plataforma}</p>
                        <p className="text-xs text-text-tertiary">{formatCompactNumber(item.visualizacoes)} views</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-accent">{item.quantidade}</p>
                        <p className="text-[10px] uppercase tracking-wider text-text-tertiary">posts</p>
                      </div>
                    </div>
                    <div className="w-full rounded-full h-1.5 bg-bg-hover">
                      <div className={cn('h-1.5 rounded-full transition-all duration-700', isInsta ? 'bg-[#E1306C]' : 'bg-accent')} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-text-tertiary">
              Nenhuma rede conectada
            </div>
          )}
        </div>

        {/* Posts by Profile */}
        <div className="card p-5 md:p-6">
          <h3 className="text-base font-semibold mb-4 text-text-primary">
            Postagens por Perfil
          </h3>
          {(data.postagens_por_perfil || []).length > 0 ? (
            <div className="space-y-3 stagger-children">
              {(data.postagens_por_perfil || []).map((item, idx) => {
                const maxQtd = Math.max(...(data.postagens_por_perfil || []).map(p => p.quantidade), 1);
                const pct = (item.quantidade / maxQtd) * 100;
                const isInsta = item.plataforma?.toLowerCase() === 'instagram';
                return (
                  <div key={idx} className="animate-fade-in">
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        isInsta ? 'bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]' : 'bg-[#010101]'
                      )}>
                        {isInsta
                          ? <Instagram className="w-4 h-4 text-white" />
                          : <Music2 className="w-4 h-4 text-white" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-text-primary">{item.nome_perfil || item.username}</p>
                        <p className="text-xs text-text-tertiary">@{item.username} · {formatCompactNumber(item.visualizacoes)} views</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-accent">{item.quantidade}</p>
                        <p className="text-[10px] text-text-tertiary">posts</p>
                      </div>
                    </div>
                    <div className="w-full rounded-full h-1 bg-bg-hover">
                      <div className={cn('h-1 rounded-full transition-all duration-700', isInsta ? 'bg-[#E1306C]' : 'bg-accent')} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-text-tertiary">
              Nenhum perfil conectado
            </div>
          )}
        </div>
      </div>

      {/* Commissions by Platform & Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Commissions by Platform */}
        <div className="card p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-accent" />
            <h3 className="text-base font-semibold text-text-primary">Comissoes por Rede</h3>
          </div>
          {(data.comissoes_por_plataforma || []).length > 0 ? (
            <div className="space-y-4">
              {(data.comissoes_por_plataforma || []).map((item) => {
                const maxVal = Math.max(...(data.comissoes_por_plataforma || []).map(p => p.valor), 1);
                const pct = (item.valor / maxVal) * 100;
                const isInsta = item.plataforma?.toLowerCase() === 'instagram';
                return (
                  <div key={item.plataforma} className="animate-fade-in">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                        isInsta ? 'bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]' : 'bg-[#010101]'
                      )}>
                        {isInsta
                          ? <Instagram className="w-4.5 h-4.5 text-white" />
                          : <Music2 className="w-4.5 h-4.5 text-white" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold capitalize text-text-primary">{item.plataforma}</p>
                        <p className="text-xs text-text-tertiary">{item.quantidade} comissoes</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-accent">{formatCurrency(item.valor)}</p>
                      </div>
                    </div>
                    <div className="w-full rounded-full h-1.5 bg-bg-hover">
                      <div className={cn('h-1.5 rounded-full transition-all duration-700', isInsta ? 'bg-[#E1306C]' : 'bg-accent')} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-text-tertiary">
              Nenhuma comissao registrada
            </div>
          )}
        </div>

        {/* Commissions by Profile */}
        <div className="card p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-accent" />
            <h3 className="text-base font-semibold text-text-primary">Comissoes por Perfil</h3>
          </div>
          {(data.comissoes_por_perfil || []).length > 0 ? (
            <div className="space-y-3 stagger-children">
              {(data.comissoes_por_perfil || []).map((item, idx) => {
                const maxVal = Math.max(...(data.comissoes_por_perfil || []).map(p => p.valor), 1);
                const pct = (item.valor / maxVal) * 100;
                const isInsta = item.plataforma?.toLowerCase() === 'instagram';
                return (
                  <div key={idx} className="animate-fade-in">
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        isInsta ? 'bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]' : 'bg-[#010101]'
                      )}>
                        {isInsta
                          ? <Instagram className="w-4 h-4 text-white" />
                          : <Music2 className="w-4 h-4 text-white" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-text-primary">{item.nome_perfil || item.username}</p>
                        <p className="text-xs text-text-tertiary">@{item.username} · {item.quantidade} comissoes</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-accent">{formatCurrency(item.valor)}</p>
                      </div>
                    </div>
                    <div className="w-full rounded-full h-1 bg-bg-hover">
                      <div className={cn('h-1 rounded-full transition-all duration-700', isInsta ? 'bg-[#E1306C]' : 'bg-accent')} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-text-tertiary">
              Nenhum perfil com comissoes
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Posts */}
        <div className="card p-5 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-text-primary">Top Postagens</h3>
            <Badge variant="accent">{(data.top_postagens || []).length} posts</Badge>
          </div>
          {/* Filters */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <select
              value={topFilterPlataforma}
              onChange={e => { setTopFilterPlataforma(e.target.value); setTopFilterPerfil('all'); }}
              className="text-xs px-3 py-1.5 rounded-lg border-0 outline-none cursor-pointer bg-bg-hover text-text-primary"
            >
              <option value="all">Todas as redes</option>
              {(data.postagens_por_plataforma || []).map(p => (
                <option key={p.plataforma} value={p.plataforma}>{p.plataforma}</option>
              ))}
            </select>
            <select
              value={topFilterPerfil}
              onChange={e => setTopFilterPerfil(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border-0 outline-none cursor-pointer bg-bg-hover text-text-primary"
            >
              <option value="all">Todos os perfis</option>
              {(data.postagens_por_perfil || [])
                .filter(p => topFilterPlataforma === 'all' || p.plataforma === topFilterPlataforma)
                .map(p => (
                  <option key={p.username} value={p.username}>@{p.username}</option>
                ))}
            </select>
            {(topFilterPlataforma !== 'all' || topFilterPerfil !== 'all') && (
              <button
                onClick={() => { setTopFilterPlataforma('all'); setTopFilterPerfil('all'); }}
                className="text-xs px-2 py-1 rounded-lg transition-colors text-text-tertiary hover:text-text-secondary"
              >
                x Limpar
              </button>
            )}
          </div>
          {(() => {
            const filtered = (data.top_postagens || []).filter(p => {
              if (topFilterPlataforma !== 'all' && p.conta_plataforma !== topFilterPlataforma) return false;
              if (topFilterPerfil !== 'all' && p.conta_username !== topFilterPerfil) return false;
              return true;
            });
            return filtered.length > 0 ? (
              <div className="space-y-2 stagger-children max-h-[480px] overflow-y-auto">
                {filtered.map((post, idx) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all animate-fade-in cursor-pointer hover:bg-bg-hover"
                  >
                    <span className="text-base font-bold w-6 text-center text-text-tertiary">
                      {idx < 3 ? ['\u{1F947}', '\u{1F948}', '\u{1F949}'][idx] : `#${idx + 1}`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-text-primary">{post.titulo}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge variant={post.categoria === 'viral' ? 'viral' : 'tecnico'}>
                          {post.categoria === 'viral' ? 'Viral' : 'Tecnico'}
                        </Badge>
                        <span className="text-xs text-text-tertiary">
                          {post.conta_plataforma} · @{post.conta_username} · {post.colaborador_nome}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-text-primary">
                        {formatCompactNumber(post.visualizacoes)}
                      </p>
                      <p className="text-xs text-text-tertiary">views</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-text-tertiary">
                Nenhuma postagem encontrada
              </div>
            );
          })()}
        </div>

        {/* Commissions by Collaborator */}
        <div className="card p-5 md:p-6">
          <h3 className="text-base font-semibold mb-4 text-text-primary">
            Comissoes por Colaborador
          </h3>
          {(data.comissoes_por_colaborador || []).length > 0 ? (
            <div className="space-y-4 stagger-children">
              {(data.comissoes_por_colaborador || []).map((item, idx) => {
                const maxValue = (data.comissoes_por_colaborador || [])[0]?.valor || 1;
                const percentage = maxValue > 0 ? (item.valor / maxValue) * 100 : 0;
                return (
                  <div key={idx} className="animate-fade-in">
                    <div className="flex items-center gap-3 mb-1.5">
                      <Avatar name={item.nome} size="sm" />
                      <span className="text-sm font-medium flex-1 text-text-primary">{item.nome}</span>
                      <span className="text-sm font-semibold text-accent">{formatCurrency(item.valor)}</span>
                    </div>
                    <div className="w-full rounded-full h-1.5 bg-bg-hover">
                      <div
                        className="h-1.5 rounded-full transition-all duration-700 bg-accent"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-text-tertiary">
              Nenhum colaborador registrado
            </div>
          )}
        </div>
      </div>

      </>)}

      {/* ==================== E-COMMERCE TAB ==================== */}
      {activeTab === 'ecommerce' && (
        <EcommerceDashboard data={shopifyData} loading={shopifyLoading} />
      )}
    </div>
  );
}

function EcommerceDashboard({ data, loading }: { data: ShopifyDashboardData | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonStats />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><SkeletonChart /></div>
          <SkeletonChart />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-[rgba(150,191,72,0.1)]">
          <Store className="w-7 h-7 text-[#96BF48]" />
        </div>
        <p className="text-lg font-semibold mb-1 text-text-primary">Nenhuma loja conectada</p>
        <p className="text-sm mb-4 text-text-secondary">Conecte uma loja Shopify para ver os dados de e-commerce.</p>
        <a href="/lojas" className="btn-accent">Conectar Loja</a>
      </div>
    );
  }

  const pedidosMesData = [...(data.pedidos_por_mes || [])].reverse().map(item => ({
    ...item,
    mes: formatMonth(item.mes),
  }));

  const statusColors: Record<string, string> = {
    paid: '#22C55E',
    pending: '#F59E0B',
    refunded: '#EF4444',
    partially_refunded: '#F97316',
    authorized: '#3B82F6',
    voided: '#6B7280',
  };

  const statusLabels: Record<string, string> = {
    paid: 'Pago',
    pending: 'Pendente',
    refunded: 'Reembolsado',
    partially_refunded: 'Reembolso Parcial',
    authorized: 'Autorizado',
    voided: 'Cancelado',
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 stagger-children">
        <StatsCard
          title="Receita Total"
          value={formatCurrency(data.total_receita)}
          icon={DollarSign}
        />
        <StatsCard
          title="Total de Pedidos"
          value={formatNumber(data.total_pedidos)}
          icon={ShoppingCart}
        />
        <StatsCard
          title="Ticket Medio"
          value={formatCurrency(data.ticket_medio)}
          icon={TrendingUp}
        />
        <StatsCard
          title="Produtos Ativos"
          value={formatNumber(data.total_produtos)}
          icon={Package}
        />
        <StatsCard
          title="Clientes"
          value={formatNumber(data.total_clientes)}
          icon={Users}
        />
      </div>

      {/* Revenue Chart + Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 card p-5 md:p-6">
          <h3 className="text-base font-semibold mb-4 text-text-primary">
            Receita por Mes
          </h3>
          {pedidosMesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={pedidosMesData}>
                <defs>
                  <linearGradient id="shopifyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#96BF48" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#96BF48" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-lg)',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'receita' ? formatCurrency(value) : value,
                    name === 'receita' ? 'Receita' : 'Pedidos',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="receita"
                  stroke="#96BF48"
                  strokeWidth={2}
                  fill="url(#shopifyGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-text-tertiary">
              Nenhum pedido registrado ainda
            </div>
          )}
        </div>

        {/* Orders by Status */}
        <div className="card p-5 md:p-6">
          <h3 className="text-base font-semibold mb-4 text-text-primary">
            Pedidos por Status
          </h3>
          {(data.pedidos_por_status || []).length > 0 ? (
            <div className="space-y-3">
              {(data.pedidos_por_status || []).map((item) => {
                const maxQtd = Math.max(...(data.pedidos_por_status || []).map(s => s.quantidade), 1);
                const pct = (item.quantidade / maxQtd) * 100;
                const color = statusColors[item.status] || '#6B7280';
                const label = statusLabels[item.status] || item.status;
                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                        <span className="text-sm font-medium text-text-primary">{label}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color }}>{item.quantidade}</span>
                    </div>
                    <div className="w-full rounded-full h-1.5 bg-bg-hover">
                      <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-text-tertiary">
              Nenhum pedido registrado
            </div>
          )}
        </div>
      </div>

      {/* Top Products + Revenue per Store */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Products */}
        <div className="card p-5 md:p-6">
          <h3 className="text-base font-semibold mb-4 text-text-primary">
            Top Produtos Vendidos
          </h3>
          {(data.top_produtos || []).length > 0 ? (
            <div className="space-y-3 stagger-children max-h-[400px] overflow-y-auto">
              {(data.top_produtos || []).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-xl animate-fade-in hover:bg-bg-hover transition-colors">
                  <span className="text-sm font-bold w-6 text-center text-text-tertiary">
                    {idx < 3 ? ['\u{1F947}', '\u{1F948}', '\u{1F949}'][idx] : `#${idx + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-text-primary">{item.titulo}</p>
                    <p className="text-xs text-text-tertiary">{item.quantidade_vendida} vendidos</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#96BF48]">{formatCurrency(item.receita)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-text-tertiary">
              Nenhum produto vendido
            </div>
          )}
        </div>

        {/* Revenue per Store */}
        <div className="card p-5 md:p-6">
          <h3 className="text-base font-semibold mb-4 text-text-primary">
            Receita por Loja
          </h3>
          {(data.receita_por_loja || []).length > 0 ? (
            <div className="space-y-4 stagger-children">
              {(data.receita_por_loja || []).map((item, idx) => {
                const maxVal = Math.max(...(data.receita_por_loja || []).map(l => l.receita), 1);
                const pct = (item.receita / maxVal) * 100;
                return (
                  <div key={idx} className="animate-fade-in">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#96BF48]">
                        <Store className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-text-primary">{item.nome_loja}</p>
                        <p className="text-xs text-text-tertiary">{item.dominio} · {item.pedidos} pedidos</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-[#96BF48]">{formatCurrency(item.receita)}</p>
                      </div>
                    </div>
                    <div className="w-full rounded-full h-1.5 bg-bg-hover">
                      <div className="h-1.5 rounded-full transition-all duration-700 bg-[#96BF48]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-text-tertiary">
              Nenhuma loja conectada
            </div>
          )}
        </div>
      </div>

      {/* Customers by City + Low Stock Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Customers by City */}
        <div className="card p-5 md:p-6">
          <h3 className="text-base font-semibold mb-4 text-text-primary">
            Clientes por Cidade
          </h3>
          {(data.clientes_por_cidade || []).length > 0 ? (
            <div className="space-y-2 stagger-children">
              {(data.clientes_por_cidade || []).map((item, idx) => {
                const maxQtd = Math.max(...(data.clientes_por_cidade || []).map(c => c.quantidade), 1);
                const pct = (item.quantidade / maxQtd) * 100;
                return (
                  <div key={idx} className="animate-fade-in">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-primary">{item.cidade}</span>
                      <span className="text-sm font-bold text-text-secondary">{item.quantidade}</span>
                    </div>
                    <div className="w-full rounded-full h-1 bg-bg-hover">
                      <div className="h-1 rounded-full transition-all duration-700 bg-[#96BF48]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-text-tertiary">
              Nenhum cliente registrado
            </div>
          )}
        </div>

        {/* Low Stock Products */}
        <div className="card p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <h3 className="text-base font-semibold text-text-primary">
              Produtos com Estoque Baixo
            </h3>
          </div>
          {(data.produtos_baixo_estoque || []).length > 0 ? (
            <div className="space-y-2 stagger-children max-h-[400px] overflow-y-auto">
              {(data.produtos_baixo_estoque || []).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 rounded-xl animate-fade-in hover:bg-bg-hover transition-colors"
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    item.estoque_total === 0 ? 'bg-error-surface' : 'bg-warning-surface'
                  )}>
                    <Package className={cn('w-4 h-4', item.estoque_total === 0 ? 'text-error' : 'text-warning')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-text-primary">{item.titulo}</p>
                    <p className="text-xs text-text-tertiary">{item.loja_nome} · {formatCurrency(item.preco_min)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-sm font-bold', item.estoque_total === 0 ? 'text-error' : 'text-warning')}>
                      {item.estoque_total}
                    </p>
                    <p className="text-[10px] text-text-tertiary">un.</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-text-tertiary">
              Nenhum produto com estoque baixo
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
