'use client';

import { useEffect, useState } from 'react';
import { Share2, Plus, Pencil, Trash2, Instagram, Music2, Users as UsersIcon, RefreshCw, Link, Unlink } from 'lucide-react';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import Badge from '@/components/Badge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { SkeletonCard } from '@/components/Skeleton';
import { useToast } from '@/components/ToastProvider';
import { formatCompactNumber, getRelativeTime } from '@/lib/utils';

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
  token_expires_at: string | null;
  tiktok_user_id: string | null;
}

export default function ContasSociaisPage() {
  const [contas, setContas] = useState<ContaSocial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<ContaSocial | null>(null);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState<ContaSocial | null>(null);
  const [form, setForm] = useState({ plataforma: 'instagram' as 'instagram' | 'tiktok', nome_perfil: '', username: '', seguidores: 0 });
  const { showToast } = useToast();

  const fetchContas = () => {
    fetch('/api/contas')
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => { if (Array.isArray(data)) setContas(data); })
      .catch(() => showToast('error', 'Erro ao carregar contas'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchContas(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'connected') {
      const count = params.get('count');
      showToast('success', count
        ? `Instagram conectado! ${count} contas encontradas e sincronizadas.`
        : 'Instagram conectado com sucesso!');
      window.history.replaceState({}, '', '/contas');
      fetchContas();
    } else if (params.get('error')) {
      showToast('error', decodeURIComponent(params.get('error')!));
      window.history.replaceState({}, '', '/contas');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editando) {
        await fetch('/api/contas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editando.id, ...form }) });
      } else {
        await fetch('/api/contas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      }
      showToast('success', editando ? 'Conta atualizada!' : 'Conta adicionada!');
      setModalOpen(false); setEditando(null); setForm({ plataforma: 'instagram', nome_perfil: '', username: '', seguidores: 0 });
      fetchContas();
    } catch { showToast('error', 'Erro ao salvar conta'); }
  };

  const handleEdit = (conta: ContaSocial) => {
    setEditando(conta);
    setForm({ plataforma: conta.plataforma, nome_perfil: conta.nome_perfil, username: conta.username, seguidores: conta.seguidores });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/contas?id=${id}`, { method: 'DELETE' });
      showToast('success', 'Conta excluída');
      fetchContas();
    } catch { showToast('error', 'Erro ao excluir'); }
  };

  const handleSync = async (contaId: number) => {
    setSyncing(contaId);
    try {
      const res = await fetch('/api/instagram/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conta_id: contaId }) });
      const data = await res.json();
      if (res.ok) { showToast('success', `Sincronizado: ${data.created} novas, ${data.updated} atualizadas.`); fetchContas(); }
      else showToast('error', data.error || 'Erro ao sincronizar');
    } catch { showToast('error', 'Erro ao sincronizar'); }
    setSyncing(null);
  };

  const handleSyncTikTok = async (contaId: number) => {
    setSyncing(contaId);
    try {
      const res = await fetch('/api/tiktok/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conta_id: contaId }) });
      const data = await res.json();
      if (res.ok) { showToast('success', `TikTok: ${data.created} novos, ${data.updated} atualizados.`); fetchContas(); }
      else showToast('error', data.error || 'Erro ao sincronizar TikTok');
    } catch { showToast('error', 'Erro ao sincronizar TikTok'); }
    setSyncing(null);
  };

  const handleDisconnect = async (conta: ContaSocial) => {
    try {
      await fetch('/api/contas', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: conta.id, ig_user_id: null, access_token: null, auto_sync: false, token_expires_at: null })
      });
      showToast('success', 'Conta desconectada');
      fetchContas();
    } catch { showToast('error', 'Erro ao desconectar'); }
  };

  const instagramContas = contas.filter(c => c.plataforma === 'instagram');
  const tiktokContas = contas.filter(c => c.plataforma === 'tiktok');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Contas Sociais"
        subtitle="Conecte e gerencie suas redes sociais"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => { window.location.href = '/api/instagram/auth'; }}
              className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl transition-all"
              style={{ background: 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)' }}
            >
              <Instagram className="w-4 h-4" /> Instagram
            </button>
            <button onClick={() => { window.location.href = '/api/tiktok/auth'; }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all"
              style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
            >
              <Music2 className="w-4 h-4" /> TikTok
            </button>
            <button onClick={() => { setEditando(null); setForm({ plataforma: 'instagram', nome_perfil: '', username: '', seguidores: 0 }); setModalOpen(true); }}
              className="btn-ghost flex items-center gap-2">
              <Plus className="w-4 h-4" /> Manual
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : contas.length === 0 ? (
        <EmptyState icon={Share2} title="Nenhuma conta conectada" description="Conecte seu Instagram ou TikTok para sincronizar postagens automaticamente."
          action={{ label: 'Conectar Instagram', onClick: () => { window.location.href = '/api/instagram/auth'; } }} />
      ) : (
        <div className="space-y-8">
          {/* Instagram */}
          {instagramContas.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)' }}>
                  <Instagram className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Instagram</h2>
                <Badge variant="default">{instagramContas.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                {instagramContas.map(conta => (
                  <ContaCard key={conta.id} conta={conta} onEdit={handleEdit} onDelete={() => setConfirmDelete(conta.id)}
                    onConnect={(id) => { window.location.href = `/api/instagram/auth?conta_id=${id}`; }}
                    onSync={handleSync} onSyncTikTok={handleSyncTikTok}
                    onDisconnect={() => setConfirmDisconnect(conta)} syncing={syncing === conta.id} />
                ))}
              </div>
            </div>
          )}

          {/* TikTok */}
          {tiktokContas.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
                  <Music2 className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>TikTok</h2>
                <Badge variant="default">{tiktokContas.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                {tiktokContas.map(conta => (
                  <ContaCard key={conta.id} conta={conta} onEdit={handleEdit} onDelete={() => setConfirmDelete(conta.id)}
                    onConnect={() => { window.location.href = '/api/tiktok/auth'; }}
                    onSync={handleSync} onSyncTikTok={handleSyncTikTok}
                    onDisconnect={() => setConfirmDisconnect(conta)} syncing={syncing === conta.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditando(null); }} title={editando ? 'Editar Conta' : 'Nova Conta Social'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Plataforma</label>
            <div className="grid grid-cols-2 gap-3">
              {(['instagram', 'tiktok'] as const).map(p => (
                <button key={p} type="button" onClick={() => setForm({ ...form, plataforma: p })}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium"
                  style={{
                    borderColor: form.plataforma === p ? 'var(--accent)' : 'var(--border)',
                    background: form.plataforma === p ? 'var(--accent-surface)' : 'transparent',
                    color: form.plataforma === p ? 'var(--accent)' : 'var(--text-secondary)',
                  }}>
                  {p === 'instagram' ? <Instagram className="w-4 h-4" /> : <Music2 className="w-4 h-4" />}
                  {p === 'instagram' ? 'Instagram' : 'TikTok'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nome do Perfil</label>
            <input className="input" required value={form.nome_perfil} onChange={e => setForm({ ...form, nome_perfil: e.target.value })} placeholder="Nome exibido no perfil" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-tertiary)' }}>@</span>
              <input className="input pl-8" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="username" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Seguidores</label>
            <input className="input" type="number" min="0" value={form.seguidores} onChange={e => setForm({ ...form, seguidores: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">Cancelar</button>
            <button type="submit" className="btn-accent">{editando ? 'Salvar' : 'Adicionar'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmDelete !== null} onClose={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) handleDelete(confirmDelete); }}
        title="Excluir Conta" message="Tem certeza? As postagens sincronizadas serão mantidas." confirmLabel="Excluir" variant="danger" />

      <ConfirmDialog isOpen={confirmDisconnect !== null} onClose={() => setConfirmDisconnect(null)}
        onConfirm={() => { if (confirmDisconnect) handleDisconnect(confirmDisconnect); }}
        title="Desconectar Conta" message="Desconectar a API? As postagens já sincronizadas serão mantidas." confirmLabel="Desconectar" variant="warning" />
    </div>
  );
}

function ContaCard({ conta, onEdit, onDelete, onConnect, onSync, onSyncTikTok, onDisconnect, syncing }: {
  conta: ContaSocial; onEdit: (c: ContaSocial) => void; onDelete: () => void;
  onConnect: (id: number) => void; onSync: (id: number) => void; onSyncTikTok: (id: number) => void; onDisconnect: () => void; syncing: boolean;
}) {
  const isInstagram = conta.plataforma === 'instagram';
  const isConnected = isInstagram ? !!conta.ig_user_id : !!conta.tiktok_user_id;

  // Health indicator
  let health: 'connected' | 'expiring' | 'disconnected' = 'disconnected';
  if (isConnected) {
    health = 'connected';
    if (conta.token_expires_at) {
      const diff = new Date(conta.token_expires_at).getTime() - Date.now();
      if (diff < 7 * 24 * 60 * 60 * 1000) health = 'expiring'; // < 7 days
    }
  }

  const healthColors = { connected: 'var(--success)', expiring: 'var(--warning)', disconnected: 'var(--text-tertiary)' };
  const healthLabels = { connected: 'Conectada', expiring: 'Token expirando', disconnected: 'Desconectada' };

  return (
    <div className="card card-hover p-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: isInstagram ? 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)' : 'var(--text-primary)' }}>
            {isInstagram ? <Instagram className="w-5 h-5 text-white" /> : <Music2 className="w-5 h-5" style={{ color: 'var(--bg-primary)' }} />}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{conta.nome_perfil}</h3>
            <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>@{conta.username}</p>
          </div>
        </div>
        {/* Health dot */}
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: healthColors[health] }} />
          <span className="text-xs font-medium" style={{ color: healthColors[health] }}>{healthLabels[health]}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <UsersIcon className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCompactNumber(conta.seguidores)}</span>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>seguidores</span>
        </div>
      </div>

      {isConnected && conta.last_sync_at && (
        <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>Último sync: {getRelativeTime(conta.last_sync_at)}</p>
      )}

      <div className="mt-4 pt-3 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
        {/* Sync / Connect */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <button
                onClick={() => isInstagram ? onSync(conta.id) : onSyncTikTok(conta.id)}
                disabled={syncing}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-all"
                style={{ background: 'var(--accent-surface)', color: 'var(--accent)' }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </button>
              <button onClick={onDisconnect}
                className="p-2 rounded-xl transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                title="Desconectar">
                <Unlink className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button onClick={() => onConnect(conta.id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-all text-white"
              style={{ background: isInstagram ? 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)' : 'var(--text-primary)' }}>
              <Link className="w-3.5 h-3.5" /> Conectar via API
            </button>
          )}
        </div>

        {/* Edit / Delete */}
        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(conta)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-xl transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            <Pencil className="w-3 h-3" /> Editar
          </button>
          <button onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-xl transition-colors"
            style={{ color: 'var(--error)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--error-surface)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            <Trash2 className="w-3 h-3" /> Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
