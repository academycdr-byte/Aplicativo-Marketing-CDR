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

// ============ SHOPIFY ============

export interface LojaShopify {
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
  // Computed fields
  total_pedidos?: number;
  total_receita?: number;
  total_produtos?: number;
  total_clientes?: number;
}

export interface PedidoShopify {
  id: number;
  loja_id: number;
  shopify_order_id: string;
  order_number: string;
  email_cliente: string;
  nome_cliente: string;
  valor_total: number;
  valor_subtotal: number;
  valor_desconto: number;
  valor_frete: number;
  valor_impostos: number;
  moeda: string;
  status_financeiro: string;
  status_fulfillment: string;
  quantidade_itens: number;
  canal_vendas: string;
  tags: string;
  data_pedido: string;
  created_at: string;
  // Joined fields
  loja_nome?: string;
  loja_dominio?: string;
}

export interface ProdutoShopify {
  id: number;
  loja_id: number;
  shopify_product_id: string;
  titulo: string;
  tipo_produto: string;
  vendor: string;
  status: string;
  tags: string;
  preco_min: number;
  preco_max: number;
  estoque_total: number;
  quantidade_variantes: number;
  imagem_url: string;
  // Joined fields
  loja_nome?: string;
}

export interface ClienteShopify {
  id: number;
  loja_id: number;
  shopify_customer_id: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  estado: string;
  pais: string;
  total_pedidos: number;
  total_gasto: number;
  tags: string;
  data_primeiro_pedido: string | null;
  data_ultimo_pedido: string | null;
  created_at: string;
}

export interface ShopifyDashboardStats {
  total_receita: number;
  total_pedidos: number;
  ticket_medio: number;
  total_produtos: number;
  total_clientes: number;
  pedidos_por_mes: { mes: string; quantidade: number; receita: number }[];
  top_produtos: { titulo: string; quantidade_vendida: number; receita: number }[];
  pedidos_por_status: { status: string; quantidade: number }[];
  clientes_por_cidade: { cidade: string; quantidade: number }[];
  receita_por_loja: { nome_loja: string; dominio: string; receita: number; pedidos: number }[];
  produtos_baixo_estoque: ProdutoShopify[];
}
