'use client';

import { useEffect, useState } from 'react';
import { FileVideo, Plus, Pencil, Trash2, Search, Eye, Heart, MessageCircle, Share, Filter, Instagram, Music2 } from 'lucide-react';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';

interface Postagem {
  id: number;
  conta_id: number;
  colaborador_id: number;
  titulo: string;
  url: string;
  categoria: 'viral' | 'tecnico';
  visualizacoes: number;
  curtidas: number;
  comentarios: number;
  compartilhamentos: number;
  data_postagem: string;
  conta_nome: string;
  conta_plataforma: string;
  conta_username: string;
  colaborador_nome: string;
}

interface Conta { id: number; plataforma: string; nome_perfil: string; username: string; }
interface Colaborador { id: number; nome: string; }

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function PostagensPage() {
  const [postagens, setPostagens] = useState<Postagem[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Postagem | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterConta, setFilterConta] = useState('');
  const [form, setForm] = useState({
    conta_id: 0,
    colaborador_id: 0,
    titulo: '',
    url: '',
    categoria: 'viral' as 'viral' | 'tecnico',
    visualizacoes: 0,
    curtidas: 0,
    comentarios: 0,
    compartilhamentos: 0,
    data_postagem: new Date().toISOString().split('T')[0],
  });

  const fetchAll = async () => {
    const [postsRes, contasRes, colabRes] = await Promise.all([
      fetch('/api/postagens').then(r => r.json()),
      fetch('/api/contas').then(r => r.json()),
      fetch('/api/colaboradores').then(r => r.json()),
    ]);
    setPostagens(postsRes);
    setContas(contasRes);
    setColaboradores(colabRes);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editando) {
      await fetch('/api/postagens', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editando.id, ...form }),
      });
    } else {
      await fetch('/api/postagens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setModalOpen(false);
    setEditando(null);
    resetForm();
    fetchAll();
  };

  const resetForm = () => {
    setForm({
      conta_id: contas[0]?.id || 0,
      colaborador_id: colaboradores[0]?.id || 0,
      titulo: '',
      url: '',
      categoria: 'viral',
      visualizacoes: 0,
      curtidas: 0,
      comentarios: 0,
      compartilhamentos: 0,
      data_postagem: new Date().toISOString().split('T')[0],
    });
  };

  const handleEdit = (post: Postagem) => {
    setEditando(post);
    setForm({
      conta_id: post.conta_id,
      colaborador_id: post.colaborador_id,
      titulo: post.titulo,
      url: post.url,
      categoria: post.categoria,
      visualizacoes: post.visualizacoes,
      curtidas: post.curtidas,
      comentarios: post.comentarios,
      compartilhamentos: post.compartilhamentos,
      data_postagem: post.data_postagem,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta postagem?')) return;
    await fetch(`/api/postagens?id=${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const openNewModal = () => {
    setEditando(null);
    resetForm();
    setModalOpen(true);
  };

  let filtered = postagens.filter(p =>
    p.titulo.toLowerCase().includes(search.toLowerCase()) ||
    p.colaborador_nome.toLowerCase().includes(search.toLowerCase())
  );
  if (filterCategoria) filtered = filtered.filter(p => p.categoria === filterCategoria);
  if (filterConta) filtered = filtered.filter(p => p.conta_id === parseInt(filterConta));

  // Calculate total views and estimated commission
  const totalViews = filtered.reduce((acc, p) => acc + p.visualizacoes, 0);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Postagens</h1>
          <p className="text-gray-500 mt-1">Gerencie as postagens e acompanhe as metricas</p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Postagem
        </button>
      </div>

      {/* Filters */}
      {postagens.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar postagem..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={filterCategoria}
            onChange={e => setFilterCategoria(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todas categorias</option>
            <option value="viral">Viral</option>
            <option value="tecnico">Tecnico</option>
          </select>
          <select
            value={filterConta}
            onChange={e => setFilterConta(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todas contas</option>
            {contas.map(c => (
              <option key={c.id} value={c.id}>@{c.username} ({c.plataforma})</option>
            ))}
          </select>
        </div>
      )}

      {/* Stats Summary */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Total Postagens</p>
            <p className="text-xl font-bold text-gray-900">{filtered.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Total Visualizacoes</p>
            <p className="text-xl font-bold text-gray-900">{formatNumber(totalViews)}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Virais</p>
            <p className="text-xl font-bold text-amber-600">{filtered.filter(p => p.categoria === 'viral').length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Tecnicos</p>
            <p className="text-xl font-bold text-purple-600">{filtered.filter(p => p.categoria === 'tecnico').length}</p>
          </div>
        </div>
      )}

      {/* List */}
      {postagens.length === 0 ? (
        <EmptyState
          icon={FileVideo}
          title="Nenhuma postagem registrada"
          description="Adicione suas postagens para comecar a calcular as comissoes de cada colaborador."
          action={{ label: 'Adicionar Postagem', onClick: openNewModal }}
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Nenhum resultado encontrado</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(post => (
            <div key={post.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 card-hover">
              <div className="flex items-start gap-4">
                {/* Platform Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  post.conta_plataforma === 'instagram'
                    ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400'
                    : 'bg-black'
                }`}>
                  {post.conta_plataforma === 'instagram' ? (
                    <Instagram className="w-5 h-5 text-white" />
                  ) : (
                    <Music2 className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{post.titulo}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">@{post.conta_username}</span>
                        <span className="text-xs text-gray-300">|</span>
                        <span className="text-xs text-gray-500">por {post.colaborador_nome}</span>
                        <span className="text-xs text-gray-300">|</span>
                        <span className="text-xs text-gray-500">{new Date(post.data_postagem).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                      post.categoria === 'viral'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {post.categoria === 'viral' ? 'Viral' : 'Tecnico'}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-5 mt-3">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-gray-700">{formatNumber(post.visualizacoes)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-gray-600">{formatNumber(post.curtidas)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <MessageCircle className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">{formatNumber(post.comentarios)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Share className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600">{formatNumber(post.compartilhamentos)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(post)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditando(null); }}
        title={editando ? 'Editar Postagem' : 'Nova Postagem'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conta Social</label>
              <select
                required
                value={form.conta_id}
                onChange={e => setForm({ ...form, conta_id: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={0}>Selecione...</option>
                {contas.map(c => (
                  <option key={c.id} value={c.id}>@{c.username} ({c.plataforma})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Colaborador</label>
              <select
                required
                value={form.colaborador_id}
                onChange={e => setForm({ ...form, colaborador_id: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={0}>Selecione...</option>
                {colaboradores.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titulo da Postagem</label>
            <input
              type="text"
              required
              value={form.titulo}
              onChange={e => setForm({ ...form, titulo: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: 5 Dicas de Marketing Digital"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL da Postagem</label>
              <input
                type="url"
                value={form.url}
                onChange={e => setForm({ ...form, url: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data da Postagem</label>
              <input
                type="date"
                required
                value={form.data_postagem}
                onChange={e => setForm({ ...form, data_postagem: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, categoria: 'viral' })}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  form.categoria === 'viral'
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <span className="font-medium">Viral</span>
                <p className="text-xs mt-0.5 opacity-70">Alto alcance</p>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, categoria: 'tecnico' })}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  form.categoria === 'tecnico'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <span className="font-medium">Tecnico</span>
                <p className="text-xs mt-0.5 opacity-70">Educacional</p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Visualizacoes</label>
              <input
                type="number"
                min="0"
                required
                value={form.visualizacoes}
                onChange={e => setForm({ ...form, visualizacoes: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Curtidas</label>
              <input
                type="number"
                min="0"
                value={form.curtidas}
                onChange={e => setForm({ ...form, curtidas: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Comentarios</label>
              <input
                type="number"
                min="0"
                value={form.comentarios}
                onChange={e => setForm({ ...form, comentarios: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Compartilhamentos</label>
              <input
                type="number"
                min="0"
                value={form.compartilhamentos}
                onChange={e => setForm({ ...form, compartilhamentos: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
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
