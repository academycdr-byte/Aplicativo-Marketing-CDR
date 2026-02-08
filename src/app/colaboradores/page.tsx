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
import { Button, Input, IconButton, FormField, Card } from '@/components/ui';
import { cn, formatDate } from '@/lib/utils';

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
      showToast('success', 'Colaborador excluido');
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
          <Button variant="accent" icon={Plus} onClick={() => { setEditing(null); setForm({ nome: '', email: '', cargo: '' }); setModalOpen(true); }}>
            Novo Colaborador
          </Button>
        }
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <Input
          type="text"
          placeholder="Buscar colaboradores..."
          className="pl-10"
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
          description={search ? 'Nenhum resultado para esta busca.' : 'Adicione membros da equipe para comecar.'}
          action={!search ? { label: 'Adicionar Colaborador', onClick: () => setModalOpen(true) } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filtered.map((colab) => (
            <Card key={colab.id} hover className="p-5 animate-fade-in">
              <div className="flex items-start gap-4">
                <Avatar name={colab.nome} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold truncate text-text-primary">{colab.nome}</h3>
                    <Badge variant={colab.ativo ? 'success' : 'error'} size="sm">
                      {colab.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Briefcase className="w-3.5 h-3.5 text-text-tertiary" />
                    <p className="text-sm truncate text-text-secondary">{colab.cargo}</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-text-tertiary" />
                    <p className="text-xs truncate text-text-tertiary">{colab.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-default">
                <p className="text-xs text-text-tertiary">Desde {formatDate(colab.created_at)}</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleStatus(colab)}
                    className={cn(
                      'p-2 rounded-lg transition-colors text-xs font-medium hover:bg-bg-hover',
                      colab.ativo ? 'text-warning' : 'text-success'
                    )}
                  >
                    {colab.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                  <IconButton
                    icon={Pencil}
                    variant="ghost"
                    size="sm"
                    label="Editar colaborador"
                    onClick={() => handleEdit(colab)}
                    className="hover:text-info hover:bg-bg-hover"
                  />
                  <IconButton
                    icon={Trash2}
                    variant="ghost"
                    size="sm"
                    label="Excluir colaborador"
                    onClick={() => setConfirmDelete(colab.id)}
                    className="hover:text-error hover:bg-error-surface"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Editar Colaborador' : 'Novo Colaborador'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nome" htmlFor="colab-nome" required>
            <Input id="colab-nome" required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
          </FormField>
          <FormField label="Email" htmlFor="colab-email" required>
            <Input id="colab-email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </FormField>
          <FormField label="Cargo" htmlFor="colab-cargo" required>
            <Input id="colab-cargo" required value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="accent" type="submit">{editing ? 'Salvar' : 'Adicionar'}</Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) handleDelete(confirmDelete); }}
        title="Excluir Colaborador"
        message="Tem certeza que deseja excluir este colaborador? Esta acao nao pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
      />
    </div>
  );
}
