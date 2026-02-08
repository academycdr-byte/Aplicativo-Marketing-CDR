'use client';

import { useEffect, useState, useMemo } from 'react';
import { FileVideo, Eye, Heart, MessageCircle, Share, Search, LayoutGrid, List, Pencil, Trash2, Instagram, Music2 } from 'lucide-react';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import Badge from '@/components/Badge';
import Avatar from '@/components/Avatar';
import ConfirmDialog from '@/components/ConfirmDialog';
import { SkeletonCard } from '@/components/Skeleton';
import { useToast } from '@/components/ToastProvider';
import { formatCompactNumber, formatDate, getRelativeTime, cn } from '@/lib/utils';

interface Postagem {
  id: number; titulo: string; url: string; visualizacoes: number; curtidas: number; comentarios: number;
  compartilhamentos: number; categoria: 'viral' | 'tecnico'; data_publicacao: string; conta_social_id: number;
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
  const [sortBy, setSortBy] = useState<'recent' | 'views'>('recent');
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
    setForm({ titulo: post.titulo, url: post.url || '', visualizacoes: post.visualizacoes, curtidas: post.curtidas, comentarios: post.comentarios, compartilhamentos: post.compartilhamentos, categoria: post.categoria, data_publicacao: post.data_publicacao?.split('T')[0] || '', conta_social_id: String(post.conta_social_id), colaborador_id: String(post.colaborador_id) });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try { await fetch(`/api/postagens?id=${id}`, { method: 'DELETE' }); showToast('success', 'Postagem excluída'); fetchPostagens(); }
    catch { showToast('error', 'Erro ao excluir'); }
  };

  const filtered = useMemo(() => {
    let result = postagens;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p => p.titulo.toLowerCase().includes(s) || p.colaborador_nome?.toLowerCase().includes(s) || p.conta_nome?.toLowerCase().includes(s));
    }
    if (filterPlataforma) result = result.filter(p => p.conta_plataforma === filterPlataforma);
    if (filterPerfil) result = result.filter(p => String(p.conta_social_id) === filterPerfil);
    if (filterCategoria) result = result.filter(p => p.categoria === filterCategoria);
    result = [...result].sort((a, b) => sortBy === 'views' ? b.visualizacoes - a.visualizacoes : new Date(b.data_publicacao).getTime() - new Date(a.data_publicacao).getTime());
    return result;
  }, [postagens, search, filterPlataforma, filterPerfil, filterCategoria, sortBy]);

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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input className="input pl-10" placeholder="Buscar postagens..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 'auto' }} value={filterPlataforma} onChange={e => { setFilterPlataforma(e.target.value); setFilterPerfil(''); }}>
          <option value="">Todas plataformas</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
        </select>
        <select className="input" style={{ width: 'auto' }} value={filterPerfil} onChange={e => setFilterPerfil(e.target.value)}>
          <option value="">Todos os perfis</option>
          {contas
            .filter(c => !filterPlataforma || c.plataforma === filterPlataforma)
            .map(c => (
              <option key={c.id} value={String(c.id)}>{c.nome_perfil} ({c.plataforma})</option>
            ))}
        </select>
        <select className="input" style={{ width: 'auto' }} value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)}>
          <option value="">Todas categorias</option>
          <option value="viral">Viral</option>
          <option value="tecnico">Técnico</option>
        </select>
        <select className="input" style={{ width: 'auto' }} value={sortBy} onChange={e => setSortBy(e.target.value as 'recent' | 'views')}>
          <option value="recent">Mais recentes</option>
          <option value="views">Mais views</option>
        </select>
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
          <button onClick={() => setViewMode('grid')} className="p-2 rounded-md transition-all"
            style={{ background: viewMode === 'grid' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')} className="p-2 rounded-md transition-all"
            style={{ background: viewMode === 'list' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
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
                  <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{post.titulo}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={post.categoria === 'viral' ? 'viral' : 'tecnico'}>{post.categoria === 'viral' ? 'Viral' : 'Técnico'}</Badge>
                    <Badge variant={post.conta_plataforma === 'instagram' ? 'instagram' : 'tiktok'}>
                      {post.conta_plataforma === 'instagram' ? 'IG' : 'TT'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleEdit(post)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--info)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setConfirmDelete(post.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--error)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="text-center">
                  <Eye className="w-3.5 h-3.5 mx-auto mb-0.5" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{formatCompactNumber(post.visualizacoes)}</p>
                </div>
                <div className="text-center">
                  <Heart className="w-3.5 h-3.5 mx-auto mb-0.5" style={{ color: 'var(--error)' }} />
                  <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{formatCompactNumber(post.curtidas)}</p>
                </div>
                <div className="text-center">
                  <MessageCircle className="w-3.5 h-3.5 mx-auto mb-0.5" style={{ color: 'var(--info)' }} />
                  <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{formatCompactNumber(post.comentarios)}</p>
                </div>
                <div className="text-center">
                  <Share className="w-3.5 h-3.5 mx-auto mb-0.5" style={{ color: 'var(--success)' }} />
                  <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{formatCompactNumber(post.compartilhamentos)}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={post.colaborador_nome || 'U'} size="sm" />
                  <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{post.colaborador_nome}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{engagementRate(post)}%</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>engajamento</p>
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
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Título', 'Plataforma', 'Cat.', 'Views', 'Curtidas', 'Com.', 'Comp.', 'Eng.', 'Colaborador', 'Data', ''].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="stagger-children">
                {filtered.map(post => (
                  <tr key={post.id} className="animate-fade-in transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <td className="px-4 py-3"><span className="font-medium truncate block max-w-[200px]" style={{ color: 'var(--text-primary)' }}>{post.titulo}</span></td>
                    <td className="px-4 py-3"><Badge variant={post.conta_plataforma === 'instagram' ? 'instagram' : 'tiktok'}>{post.conta_plataforma === 'instagram' ? 'IG' : 'TT'}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={post.categoria === 'viral' ? 'viral' : 'tecnico'}>{post.categoria === 'viral' ? 'V' : 'T'}</Badge></td>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCompactNumber(post.visualizacoes)}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{formatCompactNumber(post.curtidas)}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{formatCompactNumber(post.comentarios)}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{formatCompactNumber(post.compartilhamentos)}</td>
                    <td className="px-4 py-3"><span className="font-semibold" style={{ color: 'var(--accent)' }}>{engagementRate(post)}%</span></td>
                    <td className="px-4 py-3"><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{post.colaborador_nome}</span></td>
                    <td className="px-4 py-3"><span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{post.data_publicacao ? getRelativeTime(post.data_publicacao) : '-'}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(post)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-tertiary)' }}><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setConfirmDelete(post.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-tertiary)' }}><Trash2 className="w-3.5 h-3.5" /></button>
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
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Título</label>
              <input className="input" required value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>URL</label>
              <input className="input" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Conta Social</label>
              <select className="input" required value={form.conta_social_id} onChange={e => setForm({ ...form, conta_social_id: e.target.value })}>
                <option value="">Selecione...</option>
                {contas.map(c => <option key={c.id} value={c.id}>{c.nome_perfil} ({c.plataforma})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Colaborador</label>
              <select className="input" required value={form.colaborador_id} onChange={e => setForm({ ...form, colaborador_id: e.target.value })}>
                <option value="">Selecione...</option>
                {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Categoria</label>
              <div className="grid grid-cols-2 gap-2">
                {(['viral', 'tecnico'] as const).map(cat => (
                  <button key={cat} type="button" onClick={() => setForm({ ...form, categoria: cat })}
                    className="p-2.5 rounded-xl border-2 text-sm font-medium transition-all"
                    style={{
                      borderColor: form.categoria === cat ? 'var(--accent)' : 'var(--border)',
                      background: form.categoria === cat ? 'var(--accent-surface)' : 'transparent',
                      color: form.categoria === cat ? 'var(--accent)' : 'var(--text-secondary)',
                    }}>
                    {cat === 'viral' ? '🔥 Viral' : '📐 Técnico'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Data de Publicação</label>
              <input className="input" type="date" value={form.data_publicacao} onChange={e => setForm({ ...form, data_publicacao: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {[
              { key: 'visualizacoes', label: 'Views', icon: Eye },
              { key: 'curtidas', label: 'Curtidas', icon: Heart },
              { key: 'comentarios', label: 'Comentários', icon: MessageCircle },
              { key: 'compartilhamentos', label: 'Comps.', icon: Share },
            ].map(({ key, label, icon: Icon }) => (
              <div key={key}>
                <label className="flex items-center gap-1 text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  <Icon className="w-3 h-3" /> {label}
                </label>
                <input className="input text-center" type="number" min="0" value={(form as any)[key]}
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
