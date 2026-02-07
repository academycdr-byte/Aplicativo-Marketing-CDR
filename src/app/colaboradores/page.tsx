'use client';

import { useEffect, useState } from 'react';
import { Users, Plus, Pencil, Trash2, Search, Mail, Briefcase } from 'lucide-react';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';

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
  const [editando, setEditando] = useState<Colaborador | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ nome: '', email: '', cargo: 'Marketing' });

  const fetchColaboradores = () => {
    fetch('/api/colaboradores')
      .then(res => {
        if (!res.ok) throw new Error('Erro');
        return res.json();
      })
      .then(data => { if (Array.isArray(data)) setColaboradores(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchColaboradores(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editando) {
      await fetch('/api/colaboradores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editando.id, ...form, ativo: true }),
      });
    } else {
      await fetch('/api/colaboradores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setModalOpen(false);
    setEditando(null);
    setForm({ nome: '', email: '', cargo: 'Marketing' });
    fetchColaboradores();
  };

  const handleEdit = (colab: Colaborador) => {
    setEditando(colab);
    setForm({ nome: colab.nome, email: colab.email, cargo: colab.cargo });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este colaborador?')) return;
    await fetch(`/api/colaboradores?id=${id}`, { method: 'DELETE' });
    fetchColaboradores();
  };

  const handleToggleStatus = async (colab: Colaborador) => {
    await fetch('/api/colaboradores', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: colab.id, nome: colab.nome, email: colab.email, cargo: colab.cargo, ativo: !colab.ativo }),
    });
    fetchColaboradores();
  };

  const filtered = colaboradores.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Colaboradores</h1>
          <p className="text-gray-500 mt-1">Gerencie sua equipe de marketing</p>
        </div>
        <button
          onClick={() => { setEditando(null); setForm({ nome: '', email: '', cargo: 'Marketing' }); setModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Colaborador
        </button>
      </div>

      {/* Search */}
      {colaboradores.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar colaborador..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      )}

      {/* List */}
      {filtered.length === 0 && colaboradores.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum colaborador cadastrado"
          description="Adicione seus colaboradores de marketing para comecar a gerenciar as comissoes."
          action={{ label: 'Adicionar Colaborador', onClick: () => setModalOpen(true) }}
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Nenhum resultado encontrado</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(colab => (
            <div key={colab.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 card-hover">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-bold text-lg">
                      {colab.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{colab.nome}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {colab.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleStatus(colab)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    colab.ativo
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {colab.ativo ? 'Ativo' : 'Inativo'}
                </button>
              </div>

              <div className="mt-3 flex items-center gap-1 text-sm text-gray-500">
                <Briefcase className="w-3.5 h-3.5" />
                {colab.cargo}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                <button
                  onClick={() => handleEdit(colab)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(colab.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditando(null); }}
        title={editando ? 'Editar Colaborador' : 'Novo Colaborador'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              required
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Nome do colaborador"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="email@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
            <input
              type="text"
              required
              value={form.cargo}
              onChange={e => setForm({ ...form, cargo: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: Marketing, Social Media..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setEditando(null); }}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              {editando ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
