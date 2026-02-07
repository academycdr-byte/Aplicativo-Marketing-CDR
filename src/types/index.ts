export interface Colaborador {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  ativo: boolean;
  created_at: string;
}

export interface ContaSocial {
  id: number;
  plataforma: 'instagram' | 'tiktok';
  nome_perfil: string;
  username: string;
  avatar_url: string;
  seguidores: number;
  ativa: boolean;
  created_at: string;
}

export interface Postagem {
  id: number;
  conta_id: number;
  colaborador_id: number;
  titulo: string;
  url: string;
  thumbnail_url: string;
  categoria: 'viral' | 'tecnico';
  visualizacoes: number;
  curtidas: number;
  comentarios: number;
  compartilhamentos: number;
  data_postagem: string;
  created_at: string;
  // Joined fields
  conta_nome?: string;
  conta_plataforma?: string;
  conta_username?: string;
  colaborador_nome?: string;
  comissao_calculada?: number;
}

export interface ConfiguracaoCPM {
  id: number;
  categoria: 'viral' | 'tecnico';
  valor_por_cpm: number;
  updated_at: string;
}

export interface Comissao {
  id: number;
  colaborador_id: number;
  postagem_id: number;
  valor: number;
  mes_referencia: string;
  pago: boolean;
  data_pagamento: string | null;
  created_at: string;
  // Joined fields
  colaborador_nome?: string;
  postagem_titulo?: string;
  postagem_visualizacoes?: number;
  postagem_categoria?: string;
  conta_plataforma?: string;
}

export interface DashboardStats {
  total_visualizacoes: number;
  total_comissoes: number;
  total_postagens: number;
  total_colaboradores: number;
  comissoes_pendentes: number;
  comissoes_pagas: number;
  postagens_por_mes: { mes: string; quantidade: number }[];
  comissoes_por_colaborador: { nome: string; valor: number }[];
  visualizacoes_por_plataforma: { plataforma: string; visualizacoes: number }[];
  top_postagens: Postagem[];
}
