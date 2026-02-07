'use client';

import { useEffect, useState } from 'react';
import { Settings, DollarSign, Zap, BookOpen, Save, Check } from 'lucide-react';

interface ConfigCPM {
  id: number;
  categoria: string;
  valor_por_cpm: number;
  updated_at: string;
}

export default function ConfiguracoesPage() {
  const [configs, setConfigs] = useState<ConfigCPM[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [viralValue, setViralValue] = useState('2.00');
  const [tecnicoValue, setTecnicoValue] = useState('5.00');

  const fetchConfigs = () => {
    fetch('/api/configuracoes')
      .then(res => res.json())
      .then((data: ConfigCPM[]) => {
        setConfigs(data);
        const viral = data.find(c => c.categoria === 'viral');
        const tecnico = data.find(c => c.categoria === 'tecnico');
        if (viral) setViralValue(viral.valor_por_cpm.toFixed(2));
        if (tecnico) setTecnicoValue(tecnico.valor_por_cpm.toFixed(2));
        setLoading(false);
      });
  };

  useEffect(() => { fetchConfigs(); }, []);

  const handleSave = async (categoria: string) => {
    setSaving(categoria);
    const valor = categoria === 'viral' ? parseFloat(viralValue) : parseFloat(tecnicoValue);
    await fetch('/api/configuracoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoria, valor_por_cpm: valor }),
    });
    setSaving(null);
    setSaved(categoria);
    setTimeout(() => setSaved(null), 2000);
    fetchConfigs();
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="h-40 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuracoes</h1>
        <p className="text-gray-500 mt-1">Configure os valores de CPM para cada categoria de video</p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">Como funciona o CPM?</h3>
            <p className="text-sm text-blue-700 mt-1">
              CPM significa Custo por Mil (visualizacoes). O valor configurado abaixo sera multiplicado pelo numero de
              milhares de visualizacoes de cada postagem para calcular a comissao do colaborador.
            </p>
            <p className="text-sm text-blue-700 mt-2">
              <strong>Exemplo:</strong> Um video com 50.000 views e CPM de R$2,00 gera uma comissao de R$100,00 (50 x R$2,00).
            </p>
          </div>
        </div>
      </div>

      {/* CPM Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Viral */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Videos Virais</h3>
                <p className="text-amber-100 text-sm">Conteudo de alto alcance e engajamento</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valor por CPM (R$)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={viralValue}
                  onChange={e => setViralValue(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Ultimo ajuste: {configs.find(c => c.categoria === 'viral')?.updated_at || 'N/A'}
              </p>
            </div>
            <button
              onClick={() => handleSave('viral')}
              disabled={saving === 'viral'}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {saved === 'viral' ? (
                <><Check className="w-4 h-4" /> Salvo!</>
              ) : saving === 'viral' ? (
                'Salvando...'
              ) : (
                <><Save className="w-4 h-4" /> Salvar Alteracao</>
              )}
            </button>
          </div>
        </div>

        {/* Tecnico */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Videos Tecnicos</h3>
                <p className="text-purple-100 text-sm">Conteudo educacional e informativo</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valor por CPM (R$)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tecnicoValue}
                  onChange={e => setTecnicoValue(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Ultimo ajuste: {configs.find(c => c.categoria === 'tecnico')?.updated_at || 'N/A'}
              </p>
            </div>
            <button
              onClick={() => handleSave('tecnico')}
              disabled={saving === 'tecnico'}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              {saved === 'tecnico' ? (
                <><Check className="w-4 h-4" /> Salvo!</>
              ) : saving === 'tecnico' ? (
                'Salvando...'
              ) : (
                <><Save className="w-4 h-4" /> Salvar Alteracao</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Simulation */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Simulador de Comissao</h3>
        <SimuladorComissao viralCPM={parseFloat(viralValue)} tecnicoCPM={parseFloat(tecnicoValue)} />
      </div>
    </div>
  );
}

function SimuladorComissao({ viralCPM, tecnicoCPM }: { viralCPM: number; tecnicoCPM: number }) {
  const [views, setViews] = useState('50000');
  const [categoria, setCategoria] = useState<'viral' | 'tecnico'>('viral');

  const viewsNum = parseInt(views) || 0;
  const cpm = categoria === 'viral' ? viralCPM : tecnicoCPM;
  const comissao = (viewsNum / 1000) * cpm;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Visualizacoes</label>
        <input
          type="number"
          min="0"
          value={views}
          onChange={e => setViews(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
        <select
          value={categoria}
          onChange={e => setCategoria(e.target.value as 'viral' | 'tecnico')}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="viral">Viral (R$ {viralCPM.toFixed(2)}/CPM)</option>
          <option value="tecnico">Tecnico (R$ {tecnicoCPM.toFixed(2)}/CPM)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Comissao Estimada</label>
        <div className="px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg">
          <span className="text-lg font-bold text-green-700">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(comissao)}
          </span>
        </div>
      </div>
    </div>
  );
}
