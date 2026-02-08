'use client';

import { useEffect, useState } from 'react';
import { Store, Plus, Trash2, RefreshCw, Unlink, ShoppingCart, Package, Users as UsersIcon, Eye, EyeOff, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import Badge from '@/components/Badge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { SkeletonCard } from '@/components/Skeleton';
import { useToast } from '@/components/ToastProvider';
import { formatCurrency, formatCompactNumber, getRelativeTime } from '@/lib/utils';

interface LojaShopify {
  id: number;
  nome_loja: string;
  dominio: string;
  moeda: string;
  email_loja: string;
  plano: string;
  ativa: boolean;
  auto_sync: boolean;
  last_sync_at: string | null;
  created_at: string;
  total_pedidos: number;
  total_produtos: number;
  total_clientes: number;
}

export default function LojasShopifyPage() {
  const [lojas, setLojas] = useState<LojaShopify[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; nome?: string } | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [form, setForm] = useState({ dominio: '', access_token: '' });
  const { showToast } = useToast();

  const fetchLojas = () => {
    fetch('/api/shopify/lojas')
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => { if (Array.isArray(data)) setLojas(data); })
      .catch(() => showToast('error', 'Erro ao carregar lojas'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLojas(); }, []);

  const handleTestConnection = async () => {
    if (!form.dominio || !form.access_token) {
      showToast('error', 'Preencha o dominio e o access token');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/shopify/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dominio: form.dominio, access_token: form.access_token }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ success: true, nome: data.loja.nome_loja });
      } else {
        setTestResult({ success: false });
        showToast('error', data.error || 'Falha na conexao');
      }
    } catch {
      setTestResult({ success: false });
      showToast('error', 'Erro ao testar conexao');
    }
    setTesting(false);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.dominio || !form.access_token) {
      showToast('error', 'Preencha todos os campos');
      return;
    }
    setConnecting(true);
    try {
      const res = await fetch('/api/shopify/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dominio: form.dominio, access_token: form.access_token }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', data.isUpdate ? `Loja "${data.loja.nome_loja}" reconectada!` : `Loja "${data.loja.nome_loja}" conectada!`);
        setModalOpen(false);
        setForm({ dominio: '', access_token: '' });
        setTestResult(null);
        setShowToken(false);
        fetchLojas();
      } else {
        showToast('error', data.error || 'Erro ao conectar loja');
      }
    } catch {
      showToast('error', 'Erro ao conectar loja');
    }
    setConnecting(false);
  };

  const handleSync = async (lojaId: number) => {
    setSyncing(lojaId);
    try {
      const res = await fetch('/api/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loja_id: lojaId, type: 'all' }),
      });
      const data = await res.json();
      if (res.ok) {
        const o = data.orders || {};
        const p = data.products || {};
        const c = data.customers || {};
        showToast('success', `Sincronizado: ${o.created || 0} pedidos, ${p.created || 0} produtos, ${c.created || 0} clientes novos`);
        fetchLojas();
      } else {
        showToast('error', data.error || 'Erro ao sincronizar');
      }
    } catch {
      showToast('error', 'Erro ao sincronizar');
    }
    setSyncing(null);
  };

  const handleToggleAutoSync = async (loja: LojaShopify) => {
    try {
      await fetch('/api/shopify/lojas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loja.id, auto_sync: !loja.auto_sync }),
      });
      showToast('success', loja.auto_sync ? 'Auto-sync desativado' : 'Auto-sync ativado');
      fetchLojas();
    } catch {
      showToast('error', 'Erro ao atualizar');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/shopify/lojas?id=${id}`, { method: 'DELETE' });
      showToast('success', 'Loja removida');
      fetchLojas();
    } catch {
      showToast('error', 'Erro ao remover loja');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Lojas Shopify"
        subtitle="Conecte as lojas dos seus clientes para acompanhar vendas e produtos"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setHelpOpen(true)}
              className="btn-ghost flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4" /> Como conectar
            </button>
            <button
              onClick={() => {
                setForm({ dominio: '', access_token: '' });
                setTestResult(null);
                setShowToken(false);
                setModalOpen(true);
              }}
              className="btn-accent flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Conectar Loja
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : lojas.length === 0 ? (
        <EmptyState
          icon={Store}
          title="Nenhuma loja conectada"
          description="Conecte uma loja Shopify para sincronizar pedidos, produtos e clientes automaticamente."
          action={{ label: 'Conectar Loja', onClick: () => setModalOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {lojas.map(loja => (
            <LojaCard
              key={loja.id}
              loja={loja}
              onSync={() => handleSync(loja.id)}
              onToggleAutoSync={() => handleToggleAutoSync(loja)}
              onDelete={() => setConfirmDelete(loja.id)}
              syncing={syncing === loja.id}
            />
          ))}
        </div>
      )}

      {/* Connect Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Conectar Loja Shopify">
        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Dominio da Loja
            </label>
            <input
              className="input"
              required
              value={form.dominio}
              onChange={e => { setForm({ ...form, dominio: e.target.value }); setTestResult(null); }}
              placeholder="minha-loja.myshopify.com"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Ex: minha-loja.myshopify.com ou apenas minha-loja
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Admin API Access Token
            </label>
            <div className="relative">
              <input
                className="input pr-10"
                required
                type={showToken ? 'text' : 'password'}
                value={form.access_token}
                onChange={e => { setForm({ ...form, access_token: e.target.value }); setTestResult(null); }}
                placeholder="shpat_xxxxxxxxxxxxxxxxxxxxx"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Encontre em: Admin Shopify &gt; Configuracoes &gt; Apps &gt; Desenvolver apps
            </p>
          </div>

          {/* Test result */}
          {testResult && (
            <div
              className="flex items-center gap-2 p-3 rounded-xl text-sm"
              style={{
                background: testResult.success ? 'var(--success-surface, rgba(34,197,94,0.1))' : 'var(--error-surface, rgba(239,68,68,0.1))',
                color: testResult.success ? 'var(--success, #22C55E)' : 'var(--error, #EF4444)',
              }}
            >
              {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
              {testResult.success ? `Conectado: ${testResult.nome}` : 'Falha na conexao. Verifique os dados.'}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !form.dominio || !form.access_token}
              className="btn-ghost flex items-center gap-1.5"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Testar
            </button>
            <button
              type="submit"
              disabled={connecting}
              className="btn-accent flex items-center gap-1.5"
            >
              {connecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Store className="w-3.5 h-3.5" />}
              Conectar
            </button>
          </div>
        </form>
      </Modal>

      {/* Help Modal */}
      <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title="Como conectar uma loja Shopify">
        <div className="space-y-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <p><strong style={{ color: 'var(--text-primary)' }}>Passo 1:</strong> Acesse o admin da loja Shopify do seu cliente</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Passo 2:</strong> Va em <strong>Configuracoes</strong> &gt; <strong>Apps e canais de venda</strong> &gt; <strong>Desenvolver apps</strong></p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Passo 3:</strong> Clique em <strong>Criar um app</strong> e de um nome (ex: &quot;CDR Marketing&quot;)</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Passo 4:</strong> Em <strong>Configurar escopos da API Admin</strong>, ative:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-secondary)' }}>read_orders</code> - Pedidos</li>
            <li><code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-secondary)' }}>read_products</code> - Produtos</li>
            <li><code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-secondary)' }}>read_customers</code> - Clientes</li>
            <li><code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-secondary)' }}>read_inventory</code> - Estoque</li>
          </ul>
          <p><strong style={{ color: 'var(--text-primary)' }}>Passo 5:</strong> Clique em <strong>Instalar app</strong> e copie o <strong>Admin API access token</strong></p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Passo 6:</strong> Cole o dominio e o token aqui no CDR</p>
          <div className="p-3 rounded-xl text-xs" style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
            O token e permanente e nao expira. Guarde-o em local seguro pois ele so e exibido uma vez no Shopify.
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) handleDelete(confirmDelete); }}
        title="Remover Loja"
        message="Tem certeza? Todos os pedidos, produtos e clientes sincronizados desta loja serao removidos."
        confirmLabel="Remover"
        variant="danger"
      />
    </div>
  );
}

function LojaCard({ loja, onSync, onToggleAutoSync, onDelete, syncing }: {
  loja: LojaShopify;
  onSync: () => void;
  onToggleAutoSync: () => void;
  onDelete: () => void;
  syncing: boolean;
}) {
  return (
    <div className="card card-hover p-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#96BF48' }}
          >
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {loja.nome_loja}
            </h3>
            <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
              {loja.dominio}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: loja.ativa ? 'var(--success)' : 'var(--text-tertiary)' }} />
          <span className="text-xs font-medium" style={{ color: loja.ativa ? 'var(--success)' : 'var(--text-tertiary)' }}>
            {loja.ativa ? 'Ativa' : 'Inativa'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <ShoppingCart className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {formatCompactNumber(loja.total_pedidos)}
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>pedidos</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Package className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {formatCompactNumber(loja.total_produtos)}
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>produtos</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <UsersIcon className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {formatCompactNumber(loja.total_clientes)}
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>clientes</p>
        </div>
      </div>

      {/* Plan & currency */}
      <div className="flex items-center gap-2 mt-3">
        {loja.plano && <Badge variant="default">{loja.plano}</Badge>}
        <Badge variant="default">{loja.moeda}</Badge>
        {loja.auto_sync && <Badge variant="success">Auto-sync</Badge>}
      </div>

      {loja.last_sync_at && (
        <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
          Ultimo sync: {getRelativeTime(loja.last_sync_at)}
        </p>
      )}

      <div className="mt-4 pt-3 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
        {/* Sync */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSync}
            disabled={syncing}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-all"
            style={{ background: 'var(--accent-surface)', color: 'var(--accent)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
          <button
            onClick={onToggleAutoSync}
            className="p-2 rounded-xl transition-colors"
            style={{ color: loja.auto_sync ? 'var(--accent)' : 'var(--text-tertiary)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            title={loja.auto_sync ? 'Desativar auto-sync' : 'Ativar auto-sync'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-xl transition-colors"
          style={{ color: 'var(--error)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--error-surface)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <Trash2 className="w-3 h-3" /> Remover Loja
        </button>
      </div>
    </div>
  );
}
