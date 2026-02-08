'use client';

import { useEffect, useState } from 'react';
import { Settings, DollarSign, Calculator, Save, Sun, Moon, Monitor } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Badge from '@/components/Badge';
import { SkeletonCard } from '@/components/Skeleton';
import { useToast } from '@/components/ToastProvider';
import { useTheme } from '@/components/ThemeProvider';
import { Button, Input, Select, Card } from '@/components/ui';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { FormField } from '@/components/ui/FormField';
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
      .catch(() => showToast('error', 'Erro ao carregar configuracoes'))
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
      if (success) showToast('success', 'Configuracoes salvas!');
      else showToast('error', 'Erro ao salvar algumas configuracoes');
    } catch {
      showToast('error', 'Erro ao salvar');
    }
    setSaving(false);
  };

  const simCPM = getConfigValue(simCategoria);
  const simComissao = (simViews / 1000) * simCPM;

  const themeOptions = [
    { value: 'dark' as const, label: 'Escuro', icon: Moon },
    { value: 'light' as const, label: 'Claro', icon: Sun },
    { value: 'system' as const, label: 'Sistema', icon: Monitor },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Configuracoes" subtitle="Valores de CPM e preferencias do sistema"
        actions={
          <Button variant="accent" icon={Save} onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
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
              <DollarSign className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-semibold text-text-primary">Valores de CPM</h2>
            </div>
            <Card className="p-6">
              <div className="space-y-6">
                {configs.map(config => (
                  <div key={config.categoria}>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium flex items-center gap-2 text-text-secondary">
                        <Badge variant={config.categoria === 'viral' ? 'viral' : 'tecnico'}>
                          {config.categoria === 'viral' ? 'Viral' : 'Tecnico'}
                        </Badge>
                      </label>
                      <span className="text-lg font-bold text-accent">
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
                      <Input
                        type="number" min={0} step={0.5} value={config.valor_por_cpm}
                        onChange={e => updateLocalConfig(config.categoria, parseFloat(e.target.value) || 0)}
                        className="text-center w-24"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* Simulator */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-semibold text-text-primary">Simulador de Comissao</h2>
            </div>
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <FormField label="Categoria" htmlFor="sim-categoria">
                  <Select id="sim-categoria" value={simCategoria} onChange={e => setSimCategoria(e.target.value)}>
                    <option value="viral">Viral</option>
                    <option value="tecnico">Tecnico</option>
                  </Select>
                </FormField>
                <FormField label="Visualizacoes" htmlFor="sim-views">
                  <Input id="sim-views" type="number" min={0} step={1000} value={simViews} onChange={e => setSimViews(parseInt(e.target.value) || 0)} />
                </FormField>
              </div>

              {/* Result */}
              <div className="rounded-xl p-5 text-center bg-accent-surface border border-accent">
                <p className="text-sm font-medium text-text-secondary">Comissao estimada</p>
                <p className="text-3xl font-bold mt-1 text-accent">{formatCurrency(simComissao)}</p>
                <p className="text-xs mt-2 text-text-tertiary">
                  {formatNumber(simViews)} views x {formatCurrency(simCPM)} CPM = {formatCurrency(simComissao)}
                </p>
              </div>
            </Card>
          </section>

          {/* Preferences */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-semibold text-text-primary">Preferencias</h2>
            </div>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Aparencia</p>
                  <p className="text-xs mt-0.5 text-text-tertiary">Escolha o tema do sistema</p>
                </div>
                <SegmentedControl
                  options={themeOptions}
                  value={theme}
                  onChange={setTheme}
                  size="sm"
                />
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
