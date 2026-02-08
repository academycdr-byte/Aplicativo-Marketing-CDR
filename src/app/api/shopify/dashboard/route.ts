import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inicio = searchParams.get('inicio') || undefined;
    const fim = searchParams.get('fim') || undefined;
    const lojaId = searchParams.get('loja_id') ? Number(searchParams.get('loja_id')) : undefined;

    const stats = await getShopifyDashboardStats(inicio, fim, lojaId);
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao carregar dashboard Shopify' }, { status: 500 });
  }
}

async function getShopifyDashboardStats(inicio?: string, fim?: string, lojaId?: number) {
  // Build date filter for orders
  const dateFilter: Record<string, unknown> = {};
  if (lojaId) dateFilter.loja_id = lojaId;
  if (inicio || fim) {
    dateFilter.data_pedido = {};
    if (inicio) (dateFilter.data_pedido as Record<string, unknown>).gte = new Date(inicio);
    if (fim) {
      const fimDate = new Date(fim);
      fimDate.setDate(fimDate.getDate() + 1);
      (dateFilter.data_pedido as Record<string, unknown>).lt = fimDate;
    }
  }

  // Product filter
  const productFilter: Record<string, unknown> = {};
  if (lojaId) productFilter.loja_id = lojaId;

  // Customer filter
  const customerFilter: Record<string, unknown> = {};
  if (lojaId) customerFilter.loja_id = lojaId;

  const [
    totalReceita,
    totalPedidos,
    totalProdutos,
    totalClientes,
  ] = await Promise.all([
    prisma.pedidoShopify.aggregate({
      _sum: { valor_total: true },
      _avg: { valor_total: true },
      where: dateFilter,
    }),
    prisma.pedidoShopify.count({ where: dateFilter }),
    prisma.produtoShopify.count({ where: { ...productFilter, status: 'active' } }),
    prisma.clienteShopify.count({ where: customerFilter }),
  ]);

  // Orders by month
  const lojaCondition = lojaId ? `AND loja_id = ${lojaId}` : '';
  const dateCondition = (inicio || fim)
    ? `AND ${inicio ? `data_pedido >= '${inicio}'` : '1=1'} AND ${fim ? `data_pedido <= '${fim}'::date + interval '1 day'` : '1=1'}`
    : '';

  const pedidosPorMes = await prisma.$queryRawUnsafe<{ mes: string; quantidade: bigint; receita: number }[]>(
    `SELECT to_char(data_pedido, 'YYYY-MM') as mes,
            COUNT(*)::bigint as quantidade,
            COALESCE(SUM(valor_total), 0)::float as receita
     FROM pedidos_shopify
     WHERE 1=1 ${lojaCondition} ${dateCondition}
     GROUP BY mes ORDER BY mes DESC LIMIT 12`
  );

  // Orders by financial status
  const pedidosPorStatus = await prisma.$queryRawUnsafe<{ status: string; quantidade: bigint }[]>(
    `SELECT status_financeiro as status, COUNT(*)::bigint as quantidade
     FROM pedidos_shopify
     WHERE 1=1 ${lojaCondition} ${dateCondition}
     GROUP BY status_financeiro ORDER BY quantidade DESC`
  );

  // Top products by order frequency (from line items JSON)
  const topProdutos = await prisma.$queryRawUnsafe<{ titulo: string; quantidade_vendida: bigint; receita: number }[]>(
    `SELECT item->>'titulo' as titulo,
            SUM((item->>'quantidade')::int)::bigint as quantidade_vendida,
            SUM((item->>'preco')::float * (item->>'quantidade')::int)::float as receita
     FROM pedidos_shopify,
          jsonb_array_elements(itens_json::jsonb) as item
     WHERE 1=1 ${lojaCondition} ${dateCondition}
     GROUP BY item->>'titulo'
     ORDER BY quantidade_vendida DESC
     LIMIT 20`
  );

  // Customers by city
  const clientesPorCidade = await prisma.$queryRawUnsafe<{ cidade: string; quantidade: bigint }[]>(
    `SELECT cidade, COUNT(*)::bigint as quantidade
     FROM clientes_shopify
     WHERE cidade != '' ${lojaId ? `AND loja_id = ${lojaId}` : ''}
     GROUP BY cidade ORDER BY quantidade DESC LIMIT 15`
  );

  // Revenue per store
  const receitaPorLoja = await prisma.$queryRawUnsafe<{ nome_loja: string; dominio: string; receita: number; pedidos: bigint }[]>(
    `SELECT l.nome_loja, l.dominio,
            COALESCE(SUM(p.valor_total), 0)::float as receita,
            COUNT(p.id)::bigint as pedidos
     FROM lojas_shopify l
     LEFT JOIN pedidos_shopify p ON l.id = p.loja_id ${dateCondition.replace(/AND/g, 'AND')}
     WHERE l.ativa = true
     GROUP BY l.id, l.nome_loja, l.dominio
     ORDER BY receita DESC`
  );

  // Low stock products
  const produtosBaixoEstoque = await prisma.produtoShopify.findMany({
    where: {
      ...productFilter,
      status: 'active',
      estoque_total: { lte: 5 },
    },
    orderBy: { estoque_total: 'asc' },
    take: 20,
    include: {
      loja: { select: { nome_loja: true } },
    },
  });

  return {
    total_receita: totalReceita._sum.valor_total || 0,
    total_pedidos: totalPedidos,
    ticket_medio: totalReceita._avg.valor_total || 0,
    total_produtos: totalProdutos,
    total_clientes: totalClientes,
    pedidos_por_mes: pedidosPorMes.map((r) => ({
      mes: r.mes,
      quantidade: Number(r.quantidade),
      receita: r.receita,
    })),
    top_produtos: topProdutos.map((r) => ({
      titulo: r.titulo,
      quantidade_vendida: Number(r.quantidade_vendida),
      receita: r.receita,
    })),
    pedidos_por_status: pedidosPorStatus.map((r) => ({
      status: r.status,
      quantidade: Number(r.quantidade),
    })),
    clientes_por_cidade: clientesPorCidade.map((r) => ({
      cidade: r.cidade,
      quantidade: Number(r.quantidade),
    })),
    receita_por_loja: receitaPorLoja.map((r) => ({
      nome_loja: r.nome_loja,
      dominio: r.dominio,
      receita: r.receita,
      pedidos: Number(r.pedidos),
    })),
    produtos_baixo_estoque: produtosBaixoEstoque.map((p) => ({
      ...p,
      loja_nome: p.loja.nome_loja,
      loja: undefined,
      created_at: p.created_at.toISOString(),
      updated_at: p.updated_at.toISOString(),
    })),
  };
}
