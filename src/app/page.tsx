'use client';

import { useEffect, useState, useCallback } from 'react';
import StatsCard from '@/components/StatsCard';
import { SkeletonStats, SkeletonChart } from '@/components/Skeleton';
import Badge from '@/components/Badge';
import Avatar from '@/components/Avatar';
import { Eye, DollarSign, FileVideo, Users, TrendingUp, BarChart3, Calendar, Instagram, Music2 } from 'lucide-react';
import { formatCurrency, formatNumber, formatCompactNumber, formatMonth, getGreeting, formatFullDate, getEngagementRate } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

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
    categoria: string; conta_plataforma: string; colaborador_nome: string;
  }[];
  postagens_por_plataforma: { plataforma: string; quantidade: number; visualizacoes: number }[];
  postagens_por_perfil: { nome_perfil: string; username: string; plataforma: string; quantidade: number; visualizacoes: number }[];
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activePreset, setActivePreset] = useState<Preset>('all');
  const [customInicio, setCustomInicio] = useState('');
  const [customFim, setCustomFim] = useState('');

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

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePreset = (preset: Preset) => {
    setActivePreset(preset);
    setCustomInicio('');
    setCustomFim('');
    const dates = getPresetDates(preset);
    if (dates) fetchData(dates.inicio, dates.fim);
    else fetchData();
  };

  const handleCustomDates = () => {
    if (customInicio || customFim) {
      setActivePreset('all'); // deselect presets
      fetchData(customInicio || undefined, customFim || undefined);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-1">
          <div className="skeleton" style={{ width: 200, height: 28 }} />
          <div className="skeleton" style={{ width: 280, height: 16 }} />
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
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--error-surface)' }}>
          <BarChart3 className="w-7 h-7" style={{ color: 'var(--error)' }} />
        </div>
        <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Erro ao carregar dashboard</p>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Verifique a conexão com o banco de dados.</p>
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

  return (
    <div className={`space-y-6 md:space-y-8 animate-fade-in ${loading ? 'opacity-60 pointer-events-none' : ''}`} style={{ transition: 'opacity 0.3s' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {getGreeting()}, Admin 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {formatFullDate()}
          </p>
        </div>
      </div>

      {/* Date Selector */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-1.5 shrink-0">
            <Calendar className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Período:</span>
          </div>
          {/* Presets */}
          <div className="flex items-center gap-1 p-1 rounded-xl flex-wrap" style={{ background: 'var(--bg-hover)' }}>
            {presets.map(p => (
              <button key={p.key} onClick={() => handlePreset(p.key)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: activePreset === p.key && !customInicio && !customFim ? 'var(--bg-card)' : 'transparent',
                  color: activePreset === p.key && !customInicio && !customFim ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  boxShadow: activePreset === p.key && !customInicio && !customFim ? 'var(--shadow-sm)' : 'none',
                }}>
                {p.label}
              </button>
            ))}
          </div>
          {/* Custom */}
          <div className="flex items-center gap-2 flex-wrap">
            <input type="date" className="input text-xs" style={{ width: 'auto', padding: '6px 10px' }}
              value={customInicio} onChange={e => setCustomInicio(e.target.value)} />
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>até</span>
            <input type="date" className="input text-xs" style={{ width: 'auto', padding: '6px 10px' }}
              value={customFim} onChange={e => setCustomFim(e.target.value)} />
            <button onClick={handleCustomDates} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: 'var(--accent-surface)', color: 'var(--accent)' }}>
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 stagger-children">
        <StatsCard
          title="Total de Visualizações"
          value={formatCompactNumber(data.total_visualizacoes)}
          subtitle={`${formatNumber(data.total_visualizacoes)} views`}
          icon={Eye}
        />
        <StatsCard
          title="Total em Comissões"
          value={formatCurrency(data.total_comissoes)}
          subtitle={`${formatCurrency(data.comissoes_pendentes)} pendentes`}
          icon={DollarSign}
        />
        <StatsCard
          title="Total de Postagens"
          value={formatNumber(data.total_postagens)}
          subtitle={`Média de ${formatCompactNumber(avgViews)} views/post`}
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
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Postagens por Mês
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
            <div className="flex items-center justify-center h-[300px]" style={{ color: 'var(--text-tertiary)' }}>
              Nenhuma postagem registrada ainda
            </div>
          )}
        </div>

        {/* Donut Chart */}
        <div className="card p-5 md:p-6">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Status das Comissões
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
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{pagoPct}%</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>pago</p>
              </div>
              <div className="flex justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--warning)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Pendentes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--success)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Pagas</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px]" style={{ color: 'var(--text-tertiary)' }}>
              Nenhuma comissão registrada
            </div>
          )}
        </div>
      </div>

      {/* Platform Performance */}
      {(data.visualizacoes_por_plataforma || []).length > 0 && (
        <div className="card p-5 md:p-6">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
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
                formatter={(value: number) => [formatNumber(value), 'Visualizações']}
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
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
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
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{
                        background: isInsta ? 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)' : '#010101',
                      }}>
                        {isInsta
                          ? <Instagram className="w-4.5 h-4.5 text-white" />
                          : <Music2 className="w-4.5 h-4.5 text-white" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{item.plataforma}</p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatCompactNumber(item.visualizacoes)} views</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{item.quantidade}</p>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>posts</p>
                      </div>
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{ background: 'var(--bg-hover)' }}>
                      <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: isInsta ? '#E1306C' : 'var(--accent)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32" style={{ color: 'var(--text-tertiary)' }}>
              Nenhuma rede conectada
            </div>
          )}
        </div>

        {/* Posts by Profile */}
        <div className="card p-5 md:p-6">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
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
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{
                        background: isInsta ? 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)' : '#010101',
                      }}>
                        {isInsta
                          ? <Instagram className="w-4 h-4 text-white" />
                          : <Music2 className="w-4 h-4 text-white" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.nome_perfil || item.username}</p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>@{item.username} · {formatCompactNumber(item.visualizacoes)} views</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{item.quantidade}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>posts</p>
                      </div>
                    </div>
                    <div className="w-full rounded-full h-1" style={{ background: 'var(--bg-hover)' }}>
                      <div className="h-1 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: isInsta ? '#E1306C' : 'var(--accent)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32" style={{ color: 'var(--text-tertiary)' }}>
              Nenhum perfil conectado
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Posts */}
        <div className="card p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Top Postagens</h3>
            <Badge variant="accent">{(data.top_postagens || []).length} posts</Badge>
          </div>
          {(data.top_postagens || []).length > 0 ? (
            <div className="space-y-2 stagger-children">
              {data.top_postagens.map((post, idx) => (
                <div
                  key={post.id}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all animate-fade-in"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span className="text-base font-bold w-6 text-center" style={{ color: 'var(--text-tertiary)' }}>
                    {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{post.titulo}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant={post.categoria === 'viral' ? 'viral' : 'tecnico'}>
                        {post.categoria === 'viral' ? 'Viral' : 'Técnico'}
                      </Badge>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {post.conta_plataforma} · {post.colaborador_nome}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {formatCompactNumber(post.visualizacoes)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>views</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32" style={{ color: 'var(--text-tertiary)' }}>
              Nenhuma postagem registrada
            </div>
          )}
        </div>

        {/* Commissions by Collaborator */}
        <div className="card p-5 md:p-6">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Comissões por Colaborador
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
                      <span className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>{item.nome}</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{formatCurrency(item.valor)}</span>
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{ background: 'var(--bg-hover)' }}>
                      <div
                        className="h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${percentage}%`, background: 'var(--accent)' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32" style={{ color: 'var(--text-tertiary)' }}>
              Nenhum colaborador registrado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
