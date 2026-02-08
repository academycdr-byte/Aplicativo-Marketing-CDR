'use client';

import { useEffect, useState } from 'react';
import { Share2, Plus, Pencil, Trash2, Instagram, Music2, Users as UsersIcon, RefreshCw, Link, Unlink } from 'lucide-react';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';

interface ContaSocial {
  id: number;
  plataforma: 'instagram' | 'tiktok';
  nome_perfil: string;
  username: string;
  avatar_url: string;
  seguidores: number;
  ativa: boolean;
  created_at: string;
  ig_user_id: string | null;
  auto_sync: boolean;
  last_sync_at: string | null;
  access_token: string | null;
}

function formatNumber(value: number): string {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
  return value.toString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}min atras`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atras`;
  const days = Math.floor(hours / 24);
  return `${days}d atras`;
}

export default function ContasSociaisPage() {
  const [contas, setContas] = useState<ContaSocial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<ContaSocial | null>(null);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({
    plataforma: 'instagram' as 'instagram' | 'tiktok',
    nome_perfil: '',
    username: '',
    seguidores: 0,
  });

  const fetchContas = () => {
    fetch('/api/contas')
      .then(res => {
        if (!res.ok) throw new Error('Erro');
        return res.json();
      })
      .then(data => { if (Array.isArray(data)) setContas(data); })
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchContas(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'connected') {
      const count = params.get('count');
      const text = count
        ? `Instagram conectado com sucesso! ${count} contas encontradas e sincronizadas.`
        : 'Instagram conectado com sucesso! As postagens serao sincronizadas automaticamente.';
      setMessage({ type: 'success', text });
      window.history.replaceState({}, '', '/contas');
      fetchContas();
    } else if (params.get('error')) {
      setMessage({ type: 'error', text: decodeURIComponent(params.get('error')!) });
      window.history.replaceState({}, '', '/contas');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editando) {
      await fetch('/api/contas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editando.id, ...form }),
      });
    } else {
      await fetch('/api/contas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setModalOpen(false);
    setEditando(null);
    setForm({ plataforma: 'instagram', nome_perfil: '', username: '', seguidores: 0 });
    fetchContas();
  };

  const handleEdit = (conta: ContaSocial) => {
    setEditando(conta);
    setForm({ plataforma: conta.plataforma, nome_perfil: conta.nome_perfil, username: conta.username, seguidores: conta.seguidores });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    await fetch(`/api/contas?id=${id}`, { method: 'DELETE' });
    fetchContas();
  };

  const handleConnect = (contaId: number) => {
    window.location.href = `/api/instagram/auth?conta_id=${contaId}`;
  };

  const handleSync = async (contaId: number) => {
    setSyncing(contaId);
    try {
      const res = await fetch('/api/instagram/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conta_id: contaId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Sincronizado: ${data.created} novas postagens, ${data.updated} atualizadas.` });
        fetchContas();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao sincronizar' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao sincronizar' });
    }
    setSyncing(null);
  };

  const handleDisconnect = async (conta: ContaSocial) => {
    if (!confirm('Desconectar o Instagram? As postagens ja sincronizadas serao mantidas.')) return;
    await fetch('/api/contas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: conta.id, ig_user_id: null, access_token: null, auto_sync: false, token_expires_at: null }),
    });
    fetchContas();
  };

  const handleSyncTikTok = async (contaId: number) => {
    setSyncing(contaId);
    try {
      const res = await fetch('/api/tiktok/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conta_id: contaId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `TikTok Sincronizado: ${data.created} novos, ${data.updated} atualizados.` });
        fetchContas();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao sincronizar TikTok' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao sincronizar TikTok' });
    }
    setSyncing(null);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-48 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const instagramContas = contas.filter(c => c.plataforma === 'instagram');
  const tiktokContas = contas.filter(c => c.plataforma === 'tiktok');

  return (
    <div className="space-y-6 animate-fade-in">
      {message && (
        <div className={`rounded-xl p-4 flex items-center justify-between ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
          <p className="text-sm">{message.text}</p>
          <button onClick={() => setMessage(null)} className="text-sm font-medium underline ml-4">Fechar</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contas Sociais</h1>
          <p className="text-gray-500 mt-1">Conecte suas contas e sincronize automaticamente</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { window.location.href = '/api/instagram/auth'; }}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:opacity-90 transition-all shadow-sm"
          >
            <Instagram className="w-4 h-4" />
            Conectar Instagram
          </button>
          <button
            onClick={() => { window.location.href = '/api/tiktok/auth'; }}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-lg bg-black hover:opacity-80 transition-all shadow-sm"
          >
            <Music2 className="w-4 h-4" />
            Conectar TikTok
          </button>
          <button
            onClick={() => { window.location.href = '/api/tiktok/auth'; }}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-lg bg-black hover:opacity-80 transition-all shadow-sm"
          >
            <Music2 className="w-4 h-4" />
            Conectar TikTok
          </button>
          <button
            onClick={() => { setEditando(null); setForm({ plataforma: 'instagram', nome_perfil: '', username: '', seguidores: 0 }); setModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Conta Manual
          </button>
        </div>
      </div>

      {contas.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Instagram className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma conta conectada</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">Conecte seu Instagram para sincronizar postagens e metricas automaticamente.</p>
          <button
            onClick={() => { window.location.href = '/api/instagram/auth'; }}
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:opacity-90 transition-all shadow-md"
          >
            <Instagram className="w-5 h-5" />
            Conectar Instagram
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {instagramContas.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-lg flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Instagram</h2>
                <span className="text-sm text-gray-400">({instagramContas.length} conta{instagramContas.length > 1 ? 's' : ''})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {instagramContas.map(conta => (
                  <ContaCard key={conta.id} conta={conta} onEdit={handleEdit} onDelete={handleDelete} onConnect={handleConnect} onSync={handleSync} onSyncTikTok={handleSyncTikTok} onDisconnect={handleDisconnect} syncing={syncing === conta.id} />
                ))}
              </div>
            </div>
          )}

          {tiktokContas.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <Music2 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">TikTok</h2>
                <span className="text-sm text-gray-400">({tiktokContas.length} conta{tiktokContas.length > 1 ? 's' : ''})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tiktokContas.map(conta => (
                  <ContaCard key={conta.id} conta={conta} onEdit={handleEdit} onDelete={handleDelete} onConnect={handleConnect} onSync={handleSync} onSyncTikTok={handleSyncTikTok} onDisconnect={handleDisconnect} syncing={syncing === conta.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditando(null); }} title={editando ? 'Editar Conta' : 'Nova Conta Social'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plataforma</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setForm({ ...form, plataforma: 'instagram' })} className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${form.plataforma === 'instagram' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                <Instagram className="w-5 h-5" /><span className="font-medium">Instagram</span>
              </button>
              <button type="button" onClick={() => setForm({ ...form, plataforma: 'tiktok' })} className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${form.plataforma === 'tiktok' ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                <Music2 className="w-5 h-5" /><span className="font-medium">TikTok</span>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Perfil</label>
            <input type="text" required value={form.nome_perfil} onChange={e => setForm({ ...form, nome_perfil: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nome exibido no perfil" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
              <input type="text" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="username" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seguidores</label>
            <input type="number" min="0" value={form.seguidores} onChange={e => setForm({ ...form, seguidores: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setModalOpen(false); setEditando(null); }} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">{editando ? 'Salvar' : 'Adicionar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ContaCard({ conta, onEdit, onDelete, onConnect, onSync, onSyncTikTok, onDisconnect, syncing }: {
  conta: ContaSocial; onEdit: (c: ContaSocial) => void; onDelete: (id: number) => void;
  onConnect: (id: number) => void; onSync: (id: number) => void; onSyncTikTok: (id: number) => void; onDisconnect: (c: ContaSocial) => void; syncing: boolean;
}) {
  const isInstagram = conta.plataforma === 'instagram';
  const isConnected = !!conta.ig_user_id;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 card-hover">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isInstagram ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400' : 'bg-black'}`}>
            {isInstagram ? <Instagram className="w-6 h-6 text-white" /> : <Music2 className="w-6 h-6 text-white" />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{conta.nome_perfil}</h3>
            <p className="text-sm text-gray-500">@{conta.username}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${conta.ativa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {conta.ativa ? 'Ativa' : 'Inativa'}
          </span>
          {isConnected && <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">API conectada</span>}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <UsersIcon className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{formatNumber(conta.seguidores)}</span>
          <span className="text-gray-400">seguidores</span>
        </div>
      </div>

      {isConnected && conta.last_sync_at && (
        <div className="mt-2 text-xs text-gray-400">Ultimo sync: {timeAgo(conta.last_sync_at)}</div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
        {isInstagram ? (
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <button onClick={() => onSync(conta.id)} disabled={syncing} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Sincronizando...' : 'Sincronizar'}
                </button>
                <button onClick={() => onDisconnect(conta)} className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Desconectar">
                  <Unlink className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button onClick={() => onConnect(conta.id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-white bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:opacity-90 rounded-lg transition-all font-medium">
                <Link className="w-3.5 h-3.5" />
                Conectar via Instagram API
              </button>
            )}
          </div>
        ) : (
          // TikTok Logic
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <button disabled={true} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-400 bg-gray-50 rounded-lg cursor-not-allowed" title="Em breve">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sincronizar (Em breve)
                </button>
                <button onClick={() => onDelete(conta.id)} className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Desconectar">
                  <Unlink className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button onClick={() => { window.location.href = '/api/tiktok/auth'; }} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-white bg-black hover:opacity-90 rounded-lg transition-all font-medium">
                <Link className="w-3.5 h-3.5" />
                Conectar via TikTok API
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(conta)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Pencil className="w-3.5 h-3.5" />Editar
          </button>
          <button onClick={() => onDelete(conta.id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
