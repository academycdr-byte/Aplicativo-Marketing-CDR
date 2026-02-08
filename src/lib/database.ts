import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ============ SEED (default CPM values) ============
export async function ensureDefaultCPM() {
  const count = await prisma.configuracaoCPM.count();
  if (count === 0) {
    await prisma.configuracaoCPM.createMany({
      data: [
        { categoria: 'viral', valor_por_cpm: 2.0 },
        { categoria: 'tecnico', valor_por_cpm: 5.0 },
      ],
      skipDuplicates: true,
    });
  }
}

// ============ COLABORADORES ============
export async function getColaboradores() {
  return prisma.colaborador.findMany({ orderBy: { nome: 'asc' } });
}

export async function getColaborador(id: number) {
  return prisma.colaborador.findUnique({ where: { id } });
}

export async function createColaborador(data: { nome: string; email: string; cargo: string }) {
  return prisma.colaborador.create({ data });
}

export async function updateColaborador(id: number, data: { nome: string; email: string; cargo: string; ativo: boolean }) {
  return prisma.colaborador.update({ where: { id }, data });
}

export async function deleteColaborador(id: number) {
  await prisma.colaborador.delete({ where: { id } });
}

// ============ CONTAS SOCIAIS ============
export async function getContasSociais() {
  return prisma.contaSocial.findMany({ orderBy: [{ plataforma: 'asc' }, { nome_perfil: 'asc' }] });
}

export async function getContaSocial(id: number) {
  return prisma.contaSocial.findUnique({ where: { id } });
}

export async function createContaSocial(data: { plataforma: string; nome_perfil: string; username: string; avatar_url?: string; seguidores?: number }) {
  return prisma.contaSocial.create({
    data: {
      plataforma: data.plataforma,
      nome_perfil: data.nome_perfil,
      username: data.username,
      avatar_url: data.avatar_url || '',
      seguidores: data.seguidores || 0,
    },
  });
}

export async function updateContaSocial(id: number, data: { plataforma?: string; nome_perfil?: string; username?: string; avatar_url?: string; seguidores?: number; ativa?: boolean }) {
  return prisma.contaSocial.update({ where: { id }, data });
}

export async function deleteContaSocial(id: number) {
  await prisma.contaSocial.delete({ where: { id } });
}

// ============ POSTAGENS ============
export async function getPostagens(filters?: { conta_id?: number; colaborador_id?: number; categoria?: string; mes?: string }) {
  const where: Record<string, unknown> = {};

  if (filters?.conta_id) where.conta_id = filters.conta_id;
  if (filters?.colaborador_id) where.colaborador_id = filters.colaborador_id;
  if (filters?.categoria) where.categoria = filters.categoria;
  if (filters?.mes) {
    const [year, month] = filters.mes.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    where.data_postagem = { gte: startDate, lt: endDate };
  }

  const postagens = await prisma.postagem.findMany({
    where,
    include: {
      conta: { select: { nome_perfil: true, plataforma: true, username: true } },
      colaborador: { select: { nome: true } },
    },
    orderBy: { data_postagem: 'desc' },
  });

  return postagens.map((p) => ({
    ...p,
    data_postagem: p.data_postagem.toISOString().split('T')[0],
    created_at: p.created_at.toISOString(),
    conta_nome: p.conta.nome_perfil,
    conta_plataforma: p.conta.plataforma,
    conta_username: p.conta.username,
    colaborador_nome: p.colaborador.nome,
    conta: undefined,
    colaborador: undefined,
  }));
}

export async function getPostagem(id: number) {
  const p = await prisma.postagem.findUnique({
    where: { id },
    include: {
      conta: { select: { nome_perfil: true, plataforma: true, username: true } },
      colaborador: { select: { nome: true } },
    },
  });
  if (!p) return null;
  return {
    ...p,
    data_postagem: p.data_postagem.toISOString().split('T')[0],
    created_at: p.created_at.toISOString(),
    conta_nome: p.conta.nome_perfil,
    conta_plataforma: p.conta.plataforma,
    conta_username: p.conta.username,
    colaborador_nome: p.colaborador.nome,
    conta: undefined,
    colaborador: undefined,
  };
}

export async function createPostagem(data: {
  conta_id: number; colaborador_id: number; titulo: string; url?: string;
  thumbnail_url?: string; categoria: string; visualizacoes: number;
  curtidas?: number; comentarios?: number; compartilhamentos?: number; data_postagem: string;
}) {
  return prisma.postagem.create({
    data: {
      conta_id: data.conta_id,
      colaborador_id: data.colaborador_id,
      titulo: data.titulo,
      url: data.url || '',
      thumbnail_url: data.thumbnail_url || '',
      categoria: data.categoria,
      visualizacoes: data.visualizacoes,
      curtidas: data.curtidas || 0,
      comentarios: data.comentarios || 0,
      compartilhamentos: data.compartilhamentos || 0,
      data_postagem: new Date(data.data_postagem),
    },
  });
}

export async function updatePostagem(id: number, data: Partial<{
  conta_id: number; colaborador_id: number; titulo: string; url: string;
  thumbnail_url: string; categoria: string; visualizacoes: number;
  curtidas: number; comentarios: number; compartilhamentos: number; data_postagem: string;
}>) {
  const updateData: Record<string, unknown> = { ...data };
  if (data.data_postagem) {
    updateData.data_postagem = new Date(data.data_postagem);
  }
  await prisma.postagem.update({ where: { id }, data: updateData });
  return getPostagem(id);
}

export async function deletePostagem(id: number) {
  await prisma.comissao.deleteMany({ where: { postagem_id: id } });
  await prisma.postagem.delete({ where: { id } });
}

// ============ CONFIGURACOES CPM ============
export async function getConfiguracoesCPM() {
  await ensureDefaultCPM();
  return prisma.configuracaoCPM.findMany({ orderBy: { categoria: 'asc' } });
}

export async function updateConfiguracaoCPM(categoria: string, valor_por_cpm: number) {
  return prisma.configuracaoCPM.update({
    where: { categoria },
    data: { valor_por_cpm },
  });
}

// ============ COMISSOES ============
export async function getComissoes(filters?: { colaborador_id?: number; mes?: string; pago?: boolean }) {
  const where: Record<string, unknown> = {};

  if (filters?.colaborador_id) where.colaborador_id = filters.colaborador_id;
  if (filters?.mes) where.mes_referencia = filters.mes;
  if (filters?.pago !== undefined) where.pago = filters.pago;

  const comissoes = await prisma.comissao.findMany({
    where,
    include: {
      colaborador: { select: { nome: true } },
      postagem: {
        select: { titulo: true, visualizacoes: true, categoria: true, conta: { select: { plataforma: true } } },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return comissoes.map((c) => ({
    ...c,
    created_at: c.created_at.toISOString(),
    data_pagamento: c.data_pagamento?.toISOString() || null,
    colaborador_nome: c.colaborador.nome,
    postagem_titulo: c.postagem.titulo,
    postagem_visualizacoes: c.postagem.visualizacoes,
    postagem_categoria: c.postagem.categoria,
    conta_plataforma: c.postagem.conta.plataforma,
    colaborador: undefined,
    postagem: undefined,
  }));
}

export async function calcularComissoes(mes: string) {
  const configs = await prisma.configuracaoCPM.findMany();
  const cpmMap: Record<string, number> = {};
  configs.forEach((c) => { cpmMap[c.categoria] = c.valor_por_cpm; });

  const [year, month] = mes.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const postagens = await prisma.postagem.findMany({
    where: { data_postagem: { gte: startDate, lt: endDate } },
  });

  // Delete existing commissions for this month, then recalculate
  await prisma.comissao.deleteMany({ where: { mes_referencia: mes } });

  for (const post of postagens) {
    const cpmValue = cpmMap[post.categoria] || 0;
    const comissao = (post.visualizacoes / 1000) * cpmValue;
    await prisma.comissao.create({
      data: {
        colaborador_id: post.colaborador_id,
        postagem_id: post.id,
        valor: comissao,
        mes_referencia: mes,
      },
    });
  }

  return getComissoes({ mes });
}

export async function marcarComissaoPaga(id: number) {
  await prisma.comissao.update({
    where: { id },
    data: { pago: true, data_pagamento: new Date() },
  });
}

export async function marcarComissaoNaoPaga(id: number) {
  await prisma.comissao.update({
    where: { id },
    data: { pago: false, data_pagamento: null },
  });
}

// ============ DASHBOARD ============
export async function getDashboardStats(inicio?: string, fim?: string): Promise<Record<string, unknown>> {
  // Date filter for postagens
  const dateFilter: Record<string, unknown> = {};
  if (inicio || fim) {
    dateFilter.data_postagem = {};
    if (inicio) (dateFilter.data_postagem as Record<string, unknown>).gte = new Date(inicio);
    if (fim) {
      const fimDate = new Date(fim);
      fimDate.setDate(fimDate.getDate() + 1); // inclusive end
      (dateFilter.data_postagem as Record<string, unknown>).lt = fimDate;
    }
  }

  // Commission date filter
  const comissaoFilter: Record<string, unknown> = {};
  if (inicio || fim) {
    // Filter commissions by mes_referencia (YYYY-MM format)
    if (inicio) {
      const startMonth = inicio.substring(0, 7); // YYYY-MM
      comissaoFilter.mes_referencia = { ...(comissaoFilter.mes_referencia as object || {}), gte: startMonth };
    }
    if (fim) {
      const endMonth = fim.substring(0, 7);
      comissaoFilter.mes_referencia = { ...(comissaoFilter.mes_referencia as object || {}), lte: endMonth };
    }
  }

  const [
    totalVisualizacoes,
    totalPostagens,
    totalColaboradores,
    totalComissoes,
    comissoesPendentes,
    comissoesPagas,
  ] = await Promise.all([
    prisma.postagem.aggregate({ _sum: { visualizacoes: true }, where: dateFilter }),
    prisma.postagem.count({ where: dateFilter }),
    prisma.colaborador.count({ where: { ativo: true } }),
    prisma.comissao.aggregate({ _sum: { valor: true }, where: comissaoFilter }),
    prisma.comissao.aggregate({ _sum: { valor: true }, where: { ...comissaoFilter, pago: false } }),
    prisma.comissao.aggregate({ _sum: { valor: true }, where: { ...comissaoFilter, pago: true } }),
  ]);

  // Posts per month (last 12 months or within range)
  const dateCondition = (inicio || fim)
    ? `WHERE ${inicio ? `data_postagem >= '${inicio}'` : '1=1'} AND ${fim ? `data_postagem <= '${fim}'::date + interval '1 day'` : '1=1'}`
    : '';
  const postagensPorMes = await prisma.$queryRawUnsafe<{ mes: string; quantidade: bigint }[]>(
    `SELECT to_char(data_postagem, 'YYYY-MM') as mes, COUNT(*)::bigint as quantidade
     FROM postagens ${dateCondition} GROUP BY mes ORDER BY mes DESC LIMIT 12`
  );

  // Commissions per collaborator
  const comissaoCondition = (inicio || fim)
    ? `AND ${inicio ? `com.mes_referencia >= '${inicio.substring(0, 7)}'` : '1=1'} AND ${fim ? `com.mes_referencia <= '${fim.substring(0, 7)}'` : '1=1'}`
    : '';
  const comissoesPorColaborador = await prisma.$queryRawUnsafe<{ nome: string; valor: number }[]>(
    `SELECT col.nome, COALESCE(SUM(com.valor), 0)::float as valor
     FROM colaboradores col
     LEFT JOIN comissoes com ON col.id = com.colaborador_id ${comissaoCondition}
     WHERE col.ativo = true
     GROUP BY col.id, col.nome ORDER BY valor DESC`
  );

  // Views per platform
  const platDateCondition = (inicio || fim)
    ? `AND ${inicio ? `p.data_postagem >= '${inicio}'` : '1=1'} AND ${fim ? `p.data_postagem <= '${fim}'::date + interval '1 day'` : '1=1'}`
    : '';
  const visualizacoesPorPlataforma = await prisma.$queryRawUnsafe<{ plataforma: string; visualizacoes: bigint }[]>(
    `SELECT c.plataforma, COALESCE(SUM(p.visualizacoes), 0)::bigint as visualizacoes
     FROM contas_sociais c
     LEFT JOIN postagens p ON c.id = p.conta_id ${platDateCondition}
     GROUP BY c.plataforma`
  );

  // Top 5 posts
  const topPostagensRaw = await prisma.postagem.findMany({
    where: dateFilter,
    include: {
      conta: { select: { nome_perfil: true, plataforma: true, username: true } },
      colaborador: { select: { nome: true } },
    },
    orderBy: { visualizacoes: 'desc' },
    take: 50,
  });

  const topPostagens = topPostagensRaw.map((p) => ({
    ...p,
    data_postagem: p.data_postagem.toISOString().split('T')[0],
    created_at: p.created_at.toISOString(),
    conta_nome: p.conta.nome_perfil,
    conta_plataforma: p.conta.plataforma,
    conta_username: p.conta.username,
    colaborador_nome: p.colaborador.nome,
    conta: undefined,
    colaborador: undefined,
  }));

  // Posts per platform
  const postagensPorPlataforma = await prisma.$queryRawUnsafe<{ plataforma: string; quantidade: bigint; visualizacoes: bigint }[]>(
    `SELECT c.plataforma, COUNT(p.id)::bigint as quantidade, COALESCE(SUM(p.visualizacoes), 0)::bigint as visualizacoes
     FROM contas_sociais c
     LEFT JOIN postagens p ON c.id = p.conta_id ${platDateCondition}
     GROUP BY c.plataforma
     ORDER BY quantidade DESC`
  );

  // Posts per profile (connected account)
  const postagensPorPerfil = await prisma.$queryRawUnsafe<{ nome_perfil: string; username: string; plataforma: string; quantidade: bigint; visualizacoes: bigint }[]>(
    `SELECT c.nome_perfil, c.username, c.plataforma, COUNT(p.id)::bigint as quantidade, COALESCE(SUM(p.visualizacoes), 0)::bigint as visualizacoes
     FROM contas_sociais c
     LEFT JOIN postagens p ON c.id = p.conta_id ${platDateCondition}
     WHERE c.ativa = true
     GROUP BY c.id, c.nome_perfil, c.username, c.plataforma
     ORDER BY quantidade DESC`
  );

  // Commissions per platform (via postagem → conta)
  const comDateCondition = (inicio || fim)
    ? `AND ${inicio ? `com.mes_referencia >= '${inicio.substring(0, 7)}'` : '1=1'} AND ${fim ? `com.mes_referencia <= '${fim.substring(0, 7)}'` : '1=1'}`
    : '';
  const comissoesPorPlataforma = await prisma.$queryRawUnsafe<{ plataforma: string; valor: number; quantidade: bigint }[]>(
    `SELECT cs.plataforma, COALESCE(SUM(com.valor), 0)::float as valor, COUNT(com.id)::bigint as quantidade
     FROM comissoes com
     JOIN postagens p ON com.postagem_id = p.id
     JOIN contas_sociais cs ON p.conta_id = cs.id
     WHERE 1=1 ${comDateCondition}
     GROUP BY cs.plataforma
     ORDER BY valor DESC`
  );

  // Commissions per profile (via postagem → conta)
  const comissoesPorPerfilConta = await prisma.$queryRawUnsafe<{ nome_perfil: string; username: string; plataforma: string; valor: number; quantidade: bigint }[]>(
    `SELECT cs.nome_perfil, cs.username, cs.plataforma, COALESCE(SUM(com.valor), 0)::float as valor, COUNT(com.id)::bigint as quantidade
     FROM comissoes com
     JOIN postagens p ON com.postagem_id = p.id
     JOIN contas_sociais cs ON p.conta_id = cs.id
     WHERE 1=1 ${comDateCondition}
     GROUP BY cs.id, cs.nome_perfil, cs.username, cs.plataforma
     ORDER BY valor DESC`
  );

  return {
    total_visualizacoes: totalVisualizacoes._sum.visualizacoes || 0,
    total_comissoes: totalComissoes._sum.valor || 0,
    total_postagens: totalPostagens,
    total_colaboradores: totalColaboradores,
    comissoes_pendentes: comissoesPendentes._sum.valor || 0,
    comissoes_pagas: comissoesPagas._sum.valor || 0,
    postagens_por_mes: postagensPorMes.map((r) => ({ mes: r.mes, quantidade: Number(r.quantidade) })),
    comissoes_por_colaborador: comissoesPorColaborador,
    visualizacoes_por_plataforma: visualizacoesPorPlataforma.map((r) => ({ plataforma: r.plataforma, visualizacoes: Number(r.visualizacoes) })),
    top_postagens: topPostagens,
    postagens_por_plataforma: postagensPorPlataforma.map((r) => ({ plataforma: r.plataforma, quantidade: Number(r.quantidade), visualizacoes: Number(r.visualizacoes) })),
    postagens_por_perfil: postagensPorPerfil.map((r) => ({ nome_perfil: r.nome_perfil, username: r.username, plataforma: r.plataforma, quantidade: Number(r.quantidade), visualizacoes: Number(r.visualizacoes) })),
    comissoes_por_plataforma: comissoesPorPlataforma.map((r) => ({ plataforma: r.plataforma, valor: r.valor, quantidade: Number(r.quantidade) })),
    comissoes_por_perfil: comissoesPorPerfilConta.map((r) => ({ nome_perfil: r.nome_perfil, username: r.username, plataforma: r.plataforma, valor: r.valor, quantidade: Number(r.quantidade) })),
  };
}
