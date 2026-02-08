'use client';

import { useEffect, useState, useMemo } from 'react';
import { FileVideo, Eye, Heart, MessageCircle, Share, Search, LayoutGrid, List, Pencil, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import Badge from '@/components/Badge';
import Avatar from '@/components/Avatar';
import ConfirmDialog from '@/components/ConfirmDialog';
import { SkeletonCard } from '@/components/Skeleton';
import { useToast } from '@/components/ToastProvider';
import { IconButton } from '@/components/ui';
import { formatCompactNumber, formatDate, getRelativeTime, cn } from '@/lib/utils';

interface Postagem {
  id: number; titulo: string; url: string; visualizacoes: number; curtidas: number; comentarios: number;
  compartilhamentos: number; categoria: 'viral' | 'tecnico'; data_publicacao: string; conta_id: number;
  colaborador_id: number; conta_plataforma: string; conta_nome: string; colaborador_nome: string;
}

interface ContaSocial { id: number; plataforma: string; nome_perfil: string; }
interface Colaborador { id: number; nome: string; }

export default function PostagensPage() {
  const [postagens, setPostagens] = useState<Postagem[]>([]);
  const [contas, setContas] = useState<ContaSocial[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Postagem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [filterPlataforma, setFilterPlataforma] = useState<string>('');
  const [filterPerfil, setFilterPerfil] = useState<string>('');
  const [filterCategoria, setFilterCategoria] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string>('data_publicacao');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [form, setForm] = useState({ titulo: '', url: '', visualizacoes: 0, curtidas: 0, comentarios: 0, compartilhamentos: 0, categoria: 'viral' as 'viral' | 'tecnico', data_publicacao: '', conta_social_id: '', colaborador_id: '' });
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([
      fetch('/api/postagens').then(r => r.json()),
      fetch('/api/contas').then(r => r.json()),
      fetch('/api/colaboradores').then(r => r.json()),
    ]).then(([p, c, col]) => {
      if (Array.isArray(p)) setPostagens(p);
      if (Array.isArray(c)) setContas(c);
      if (Array.isArray(col)) setColaboradores(col);
    }).catch(() => showToast('error', 'Erro ao carregar dados'))
      .finally(() => setLoading(false));
  }, []);

  const fetchPostagens = async () => {
    const res = await fetch('/api/postagens');
    const data = await res.json();
    if (Array.isArray(data)) setPostagens(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { ...form, conta_social_id: parseInt(form.conta_social_id as string), colaborador_id: parseInt(form.colaborador_id as string) };
    try {
      if (editando) {
        await fetch('/api/postagens', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editando.id, ...body }) });
      } else {
        await fetch('/api/postagens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }
      showToast('success', editando ? 'Postagem atualizada!' : 'Postagem adicionada!');
      setModalOpen(false); setEditando(null); fetchPostagens();
    } catch { showToast('error', 'Erro ao salvar'); }
  };

  const handleEdit = (post: Postagem) => {
    setEditando(post);
    setForm({ titulo: post.titulo, url: post.url || '', visualizacoes: post.visualizacoes, curtidas: post.curtidas, comentarios: post.comentarios, compartilhamentos: post.compartilhamentos, categoria: post.categoria, data_publicacao: post.data_publicacao?.split('T')[0] || '', conta_social_id: String(post.conta_id), colaborador_id: String(post.colaborador_id) });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try { await fetch(`/api/postagens?id=${id}`, { method: 'DELETE' }); showToast('success', 'Postagem excluida'); fetchPostagens(); }
    catch { showToast('error', 'Erro ao excluir'); }
  };

  const engRate = (p: Postagem) => p.visualizacoes > 0 ? ((p.curtidas || 0) + (p.comentarios || 0) + (p.compartilhamentos || 0)) / p.visualizacoes * 100 : 0;

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortColumn(col);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    let result = postagens;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p => p.titulo.toLowerCase().includes(s) || p.colaborador_nome?.toLowerCase().includes(s) || p.conta_nome?.toLowerCase().includes(s));
    }
    if (filterPlataforma) result = result.filter(p => p.conta_plataforma === filterPlataforma);
    if (filterPerfil) result = result.filter(p => String(p.conta_id) === filterPerfil);
    if (filterCategoria) result = result.filter(p => p.categoria === filterCategoria);
    result = [...result].sort((a, b) => {
      let valA: number, valB: number;
      switch (sortColumn) {
        case 'visualizacoes': valA = a.visualizacoes; valB = b.visualizacoes; break;
        case 'curtidas': valA = a.curtidas; valB = b.curtidas; break;
        case 'comentarios': valA = a.comentarios; valB = b.comentarios; break;
        case 'compartilhamentos': valA = a.compartilhamentos; valB = b.compartilhamentos; break;
        case 'engajamento': valA = engRate(a); valB = engRate(b); break;
        case 'data_publicacao':
        default: valA = new Date(a.data_publicacao).getTime(); valB = new Date(b.data_publicacao).getTime(); break;
      }
      return sortDir === 'desc' ? valB - valA : valA - valB;
    });
    return result;
  }, [postagens, search, filterPlataforma, filterPerfil, filterCategoria, sortColumn, sortDir]);

  const engagementRate = (p: Postagem) => p.visualizacoes > 0 ? (((p.curtidas || 0) + (p.comentarios || 0) + (p.compartilhamentos || 0)) / p.visualizacoes * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Postagens" subtitle={`${postagens.length} postagens registradas`}
        actions={
          <button onClick={() => { setEditando(null); setForm({ titulo: '', url: '', visualizacoes: 0, curtidas: 0, comentarios: 0, compartilhamentos: 0, categoria: 'viral', data_publicacao: '', conta_social_id: '', colaborador_id: '' }); setModalOpen(true); }} className="btn-accent flex items-center gap-2">
            <FileVideo className="w-4 h-4" /> Nova Postagem
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input className="input pl-10" placeholder="Buscar postagens..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterPlataforma} onChange={e => { setFilterPlataforma(e.target.value); setFilterPerfil(''); }}>
          <option value="">Todas plataformas</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
        </select>
        <select className="input w-auto" value={filterPerfil} onChange={e => setFilterPerfil(e.target.value)}>
          <option value="">Todos os perfis</option>
          {contas
            .filter(c => !filterPlataforma || c.plataforma === filterPlataforma)
            .map(c => (
              <option key={c.id} value={String(c.id)}>{c.nome_perfil} ({c.plataforma})</option>
            ))}
        </select>
        <select className="input w-auto" value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)}>
          <option value="">Todas categorias</option>
          <option value="viral">Viral</option>
          <option value="tecnico">Tecnico</option>
        </select>
        <select className="input w-auto" value={sortColumn === 'data_publicacao' ? 'recent' : sortColumn} onChange={e => { const v = e.target.value; if (v === 'recent') { setSortColumn('data_publicacao'); setSortDir('desc'); } else { setSortColumn(v); setSortDir('desc'); } }}>
          <option value="recent">Mais recentes</option>
          <option value="visualizacoes">Mais views</option>
          <option value="curtidas">Mais curtidas</option>
          <option value="engajamento">Maior engajamento</option>
        </select>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-bg-hover">
          <button onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-md transition-all',
              viewMode === 'grid' ? 'bg-bg-card text-text-primary' : 'text-text-tertiary'
            )}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')}
            className={cn(
              'p-2 rounded-md transition-all',
              viewMode === 'list' ? 'bg-bg-card text-text-primary' : 'text-text-tertiary'
            )}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileVideo} title="Nenhuma postagem" description={search ? 'Nenhum resultado.' : 'Adicione postagens ou sincronize com suas contas.'} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filtered.map(post => (
            <div key={post.id} className="card card-hover p-5 animate-fade-in flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold truncate text-text-primary">{post.titulo}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={post.categoria === 'viral' ? 'viral' : 'tecnico'}>{post.categoria === 'viral' ? 'Viral' : 'Tecnico'}</Badge>
                    <Badge variant={post.conta_plataforma === 'instagram' ? 'instagram' : 'tiktok'}>
                      {post.conta_plataforma === 'instagram' ? 'IG' : 'TT'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <IconButton
                    icon={Pencil}
                    variant="ghost"
                    size="sm"
                    label="Editar postagem"
                    onClick={() => handleEdit(post)}
                    className="hover:text-info"
                  />
                  <IconButton
                    icon={Trash2}
                    variant="destructive"
                    size="sm"
                    label="Excluir postagem"
                    onClick={() => setConfirmDelete(post.id)}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-border-default">
                <div className="text-center">
                  <Eye className="w-3.5 h-3.5 mx-auto mb-0.5 text-text-tertiary" />
                  <p className="text-xs font-bold text-text-primary">{formatCompactNumber(post.visualizacoes)}</p>
                </div>
                <div className="text-center">
                  <Heart className="w-3.5 h-3.5 mx-auto mb-0.5 text-error" />
                  <p className="text-xs font-bold text-text-primary">{formatCompactNumber(post.curtidas)}</p>
                </div>
                <div className="text-center">
                  <MessageCircle className="w-3.5 h-3.5 mx-auto mb-0.5 text-info" />
                  <p className="text-xs font-bold text-text-primary">{formatCompactNumber(post.comentarios)}</p>
                </div>
                <div className="text-center">
                  <Share className="w-3.5 h-3.5 mx-auto mb-0.5 text-success" />
                  <p className="text-xs font-bold text-text-primary">{formatCompactNumber(post.compartilhamentos)}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-border-default">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={post.colaborador_nome || 'U'} size="sm" />
                  <span className="text-xs truncate text-text-secondary">{post.colaborador_nome}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-accent">{engagementRate(post)}%</p>
                  <p className="text-[10px] text-text-tertiary">engajamento</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default">
                  {[
                    { label: 'Titulo', key: '' },
                    { label: 'Plataforma', key: '' },
                    { label: 'Cat.', key: '' },
                    { label: 'Views', key: 'visualizacoes' },
                    { label: 'Curtidas', key: 'curtidas' },
                    { label: 'Com.', key: 'comentarios' },
                    { label: 'Comp.', key: 'compartilhamentos' },
                    { label: 'Eng.', key: 'engajamento' },
                    { label: 'Colaborador', key: '' },
                    { label: 'Data', key: 'data_publicacao' },
                    { label: '', key: '' },
                  ].map((h, i) => (
                    <th key={i}
                      className={cn(
                        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider',
                        h.key ? 'cursor-pointer select-none' : '',
                        sortColumn === h.key ? 'text-accent' : 'text-text-tertiary'
                      )}
                      onClick={() => h.key && handleSort(h.key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {h.label}
                        {h.key && (
                          sortColumn === h.key
                            ? (sortDir === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)
                            : <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="stagger-children">
                {filtered.map(post => (
                  <tr key={post.id} className="animate-fade-in transition-colors border-b border-border-default hover:bg-bg-hover">
                    <td className="px-4 py-3"><span className="font-medium truncate block max-w-[200px] text-text-primary">{post.titulo}</span></td>
                    <td className="px-4 py-3"><Badge variant={post.conta_plataforma === 'instagram' ? 'instagram' : 'tiktok'}>{post.conta_plataforma === 'instagram' ? 'IG' : 'TT'}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={post.categoria === 'viral' ? 'viral' : 'tecnico'}>{post.categoria === 'viral' ? 'V' : 'T'}</Badge></td>
                    <td className="px-4 py-3 font-semibold text-text-primary">{formatCompactNumber(post.visualizacoes)}</td>
                    <td className="px-4 py-3 text-text-secondary">{formatCompactNumber(post.curtidas)}</td>
                    <td className="px-4 py-3 text-text-secondary">{formatCompactNumber(post.comentarios)}</td>
                    <td className="px-4 py-3 text-text-secondary">{formatCompactNumber(post.compartilhamentos)}</td>
                    <td className="px-4 py-3"><span className="font-semibold text-accent">{engagementRate(post)}%</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-text-secondary">{post.colaborador_nome}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-text-tertiary">{post.data_publicacao ? getRelativeTime(post.data_publicacao) : '-'}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <IconButton icon={Pencil} variant="ghost" size="sm" label="Editar postagem" onClick={() => handleEdit(post)} />
                        <IconButton icon={Trash2} variant="destructive" size="sm" label="Excluir postagem" onClick={() => setConfirmDelete(post.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditando(null); }} title={editando ? 'Editar Postagem' : 'Nova Postagem'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5 text-text-secondary">Titulo</label>
              <input className="input" required value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5 text-text-secondary">URL</label>
              <input className="input" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-text-secondary">Conta Social</label>
              <select className="input" required value={form.conta_social_id} onChange={e => setForm({ ...form, conta_social_id: e.target.value })}>
                <option value="">Selecione...</option>
                {contas.map(c => <option key={c.id} value={c.id}>{c.nome_perfil} ({c.plataforma})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-text-secondary">Colaborador</label>
              <select className="input" required value={form.colaborador_id} onChange={e => setForm({ ...form, colaborador_id: e.target.value })}>
                <option value="">Selecione...</option>
                {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-text-secondary">Categoria</label>
              <div className="grid grid-cols-2 gap-2">
                {(['viral', 'tecnico'] as const).map(cat => (
                  <button key={cat} type="button" onClick={() => setForm({ ...form, categoria: cat })}
                    className={cn(
                      'p-2.5 rounded-xl border-2 text-sm font-medium transition-all',
                      form.categoria === cat
                        ? 'border-accent bg-accent-surface text-accent'
                        : 'border-border-default bg-transparent text-text-secondary'
                    )}>
                    {cat === 'viral' ? 'Viral' : 'Tecnico'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-text-secondary">Data de Publicacao</label>
              <input className="input" type="date" value={form.data_publicacao} onChange={e => setForm({ ...form, data_publicacao: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {[
              { key: 'visualizacoes', label: 'Views', icon: Eye },
              { key: 'curtidas', label: 'Curtidas', icon: Heart },
              { key: 'comentarios', label: 'Comentarios', icon: MessageCircle },
              { key: 'compartilhamentos', label: 'Comps.', icon: Share },
            ].map(({ key, label, icon: Icon }) => (
              <div key={key}>
                <label className="flex items-center gap-1 text-xs font-medium mb-1 text-text-tertiary">
                  <Icon className="w-3 h-3" /> {label}
                </label>
                <input className="input text-center" type="number" min="0" value={(form as Record<string, unknown>)[key] as number}
                  onChange={e => setForm({ ...form, [key]: parseInt(e.target.value) || 0 })} />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">Cancelar</button>
            <button type="submit" className="btn-accent">{editando ? 'Salvar' : 'Adicionar'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmDelete !== null} onClose={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) handleDelete(confirmDelete); }}
        title="Excluir Postagem" message="Tem certeza que deseja excluir esta postagem?" confirmLabel="Excluir" variant="danger" />
    </div>
  );
}
