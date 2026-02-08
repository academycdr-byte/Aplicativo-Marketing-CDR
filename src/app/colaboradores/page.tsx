'use client';

import { useEffect, useState } from 'react';
import { Users, Plus, Pencil, Trash2, Search, Mail, Briefcase } from 'lucide-react';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import Avatar from '@/components/Avatar';
import Badge from '@/components/Badge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { SkeletonCard } from '@/components/Skeleton';
import { useToast } from '@/components/ToastProvider';
import { formatDate } from '@/lib/utils';

interface Colaborador {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  ativo: number;
  created_at: string;
}

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Colaborador | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ nome: '', email: '', cargo: '' });
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const { showToast } = useToast();

  const fetchColaboradores = async () => {
    try {
      const res = await fetch('/api/colaboradores');
      const data = await res.json();
      setColaboradores(data);
    } catch {
      showToast('error', 'Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchColaboradores(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch('/api/colaboradores', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      showToast('success', editing ? 'Colaborador atualizado!' : 'Colaborador adicionado!');
      setModalOpen(false);
      setEditing(null);
      setForm({ nome: '', email: '', cargo: '' });
      fetchColaboradores();
    } catch {
      showToast('error', 'Erro ao salvar colaborador');
    }
  };

  const handleEdit = (colab: Colaborador) => {
    setEditing(colab);
    setForm({ nome: colab.nome, email: colab.email, cargo: colab.cargo });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch('/api/colaboradores', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      showToast('success', 'Colaborador excluído');
      fetchColaboradores();
    } catch {
      showToast('error', 'Erro ao excluir');
    }
  };

  const handleToggleStatus = async (colab: Colaborador) => {
    try {
      await fetch('/api/colaboradores', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: colab.id, nome: colab.nome, email: colab.email, cargo: colab.cargo, ativo: colab.ativo ? 0 : 1 }),
      });
      fetchColaboradores();
    } catch {
      showToast('error', 'Erro ao atualizar status');
    }
  };

  const filtered = colaboradores.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.cargo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Colaboradores"
        subtitle={`${colaboradores.length} membros da equipe`}
        actions={
          <button onClick={() => { setEditing(null); setForm({ nome: '', email: '', cargo: '' }); setModalOpen(true); }} className="btn-accent flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo Colaborador
          </button>
        }
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
        <input
          type="text"
          placeholder="Buscar colaboradores..."
          className="input pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum colaborador"
          description={search ? 'Nenhum resultado para esta busca.' : 'Adicione membros da equipe para começar.'}
          action={!search ? { label: 'Adicionar Colaborador', onClick: () => setModalOpen(true) } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filtered.map((colab) => (
            <div key={colab.id} className="card card-hover p-5 animate-fade-in">
              <div className="flex items-start gap-4">
                <Avatar name={colab.nome} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{colab.nome}</h3>
                    <Badge variant={colab.ativo ? 'success' : 'error'} size="sm">
                      {colab.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Briefcase className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                    <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{colab.cargo}</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                    <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{colab.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Desde {formatDate(colab.created_at)}</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleStatus(colab)}
                    className="p-2 rounded-lg transition-colors text-xs font-medium"
                    style={{ color: colab.ativo ? 'var(--warning)' : 'var(--success)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    {colab.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => handleEdit(colab)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--info)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; }}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(colab.id)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--error-surface)'; (e.currentTarget as HTMLElement).style.color = 'var(--error)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Editar Colaborador' : 'Novo Colaborador'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nome</label>
            <input className="input" required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
            <input className="input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Cargo</label>
            <input className="input" required value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">Cancelar</button>
            <button type="submit" className="btn-accent">{editing ? 'Salvar' : 'Adicionar'}</button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) handleDelete(confirmDelete); }}
        title="Excluir Colaborador"
        message="Tem certeza que deseja excluir este colaborador? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
      />
    </div>
  );
}
