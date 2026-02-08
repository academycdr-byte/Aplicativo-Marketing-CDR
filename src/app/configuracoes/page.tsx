'use client';

import { useEffect, useState } from 'react';
import { Settings, DollarSign, Calculator, Save, Sun, Moon, Monitor } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Badge from '@/components/Badge';
import { SkeletonCard } from '@/components/Skeleton';
import { useToast } from '@/components/ToastProvider';
import { useTheme } from '@/components/ThemeProvider';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface ConfiguracaoCPM {
  id: number;
  categoria: string;
  valor_por_cpm: number;
}

export default function ConfiguracoesPage() {
  const [configs, setConfigs] = useState<ConfiguracaoCPM[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();

  // Simulator
  const [simCategoria, setSimCategoria] = useState('viral');
  const [simViews, setSimViews] = useState(10000);

  useEffect(() => {
    fetch('/api/configuracoes')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setConfigs(data); })
      .catch(() => showToast('error', 'Erro ao carregar configurações'))
      .finally(() => setLoading(false));
  }, []);

  const getConfigValue = (categoria: string) => {
    return configs.find(c => c.categoria === categoria)?.valor_por_cpm || 0;
  };

  const updateLocalConfig = (categoria: string, valor_por_cpm: number) => {
    setConfigs(prev => prev.map(c => c.categoria === categoria ? { ...c, valor_por_cpm } : c));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let success = true;
      for (const config of configs) {
        const res = await fetch('/api/configuracoes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoria: config.categoria, valor_por_cpm: config.valor_por_cpm }),
        });
        if (!res.ok) success = false;
      }
      if (success) showToast('success', 'Configurações salvas!');
      else showToast('error', 'Erro ao salvar algumas configurações');
    } catch {
      showToast('error', 'Erro ao salvar');
    }
    setSaving(false);
  };

  const simCPM = getConfigValue(simCategoria);
  const simComissao = (simViews / 1000) * simCPM;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Configurações" subtitle="Valores de CPM e preferências do sistema"
        actions={
          <button onClick={handleSave} disabled={saving} className="btn-accent flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {/* CPM Configuration */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Valores de CPM</h2>
            </div>
            <div className="card p-6">
              <div className="space-y-6">
                {configs.map(config => (
                  <div key={config.categoria}>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <Badge variant={config.categoria === 'viral' ? 'viral' : 'tecnico'}>
                          {config.categoria === 'viral' ? '🔥 Viral' : '📐 Técnico'}
                        </Badge>
                      </label>
                      <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                        {formatCurrency(config.valor_por_cpm)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range" min="0" max="100" step="0.5" value={config.valor_por_cpm}
                        onChange={e => updateLocalConfig(config.categoria, parseFloat(e.target.value))}
                        className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, var(--accent) ${config.valor_por_cpm}%, var(--bg-hover) ${config.valor_por_cpm}%)`,
                        }}
                      />
                      <input
                        type="number" min="0" step="0.5" value={config.valor_por_cpm}
                        onChange={e => updateLocalConfig(config.categoria, parseFloat(e.target.value) || 0)}
                        className="input text-center w-24"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Simulator */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Simulador de Comissão</h2>
            </div>
            <div className="card p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Categoria</label>
                  <select className="input" value={simCategoria} onChange={e => setSimCategoria(e.target.value)}>
                    <option value="viral">Viral</option>
                    <option value="tecnico">Técnico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Visualizações</label>
                  <input className="input" type="number" min="0" step="1000" value={simViews} onChange={e => setSimViews(parseInt(e.target.value) || 0)} />
                </div>
              </div>

              {/* Result */}
              <div className="rounded-xl p-5 text-center" style={{ background: 'var(--accent-surface)', border: '1px solid var(--accent)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Comissão estimada</p>
                <p className="text-3xl font-bold mt-1" style={{ color: 'var(--accent)' }}>{formatCurrency(simComissao)}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                  {formatNumber(simViews)} views × {formatCurrency(simCPM)} CPM = {formatCurrency(simComissao)}
                </p>
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Preferências</h2>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Aparência</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Escolha o tema do sistema</p>
                </div>
                <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-hover)' }}>
                  {([
                    { value: 'dark' as const, icon: Moon, label: 'Escuro' },
                    { value: 'light' as const, icon: Sun, label: 'Claro' },
                    { value: 'system' as const, icon: Monitor, label: 'Sistema' },
                  ]).map(opt => (
                    <button key={opt.value} onClick={() => setTheme(opt.value)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: theme === opt.value ? 'var(--bg-card)' : 'transparent',
                        color: theme === opt.value ? 'var(--text-primary)' : 'var(--text-tertiary)',
                        boxShadow: theme === opt.value ? 'var(--shadow-sm)' : 'none',
                      }}>
                      <opt.icon className="w-3.5 h-3.5" /> {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
