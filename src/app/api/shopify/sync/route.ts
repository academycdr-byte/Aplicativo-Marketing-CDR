import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import {
  fetchShopifyOrders,
  fetchShopifyProducts,
  fetchShopifyCustomers,
} from '@/lib/shopify';

type SyncType = 'orders' | 'products' | 'customers' | 'all';

export async function POST(request: NextRequest) {
  try {
    const { loja_id, type = 'all' } = await request.json() as { loja_id: number; type?: SyncType };

    if (!loja_id) {
      return NextResponse.json({ error: 'loja_id obrigatorio' }, { status: 400 });
    }

    const loja = await prisma.lojaShopify.findUnique({ where: { id: loja_id } });
    if (!loja || !loja.access_token) {
      return NextResponse.json({ error: 'Loja nao encontrada ou sem credenciais' }, { status: 400 });
    }

    if (!loja.ativa) {
      return NextResponse.json({ error: 'Loja esta desativada' }, { status: 400 });
    }

    const result: Record<string, unknown> = { status: 'ok' };
    const sinceDate = loja.last_sync_at?.toISOString() || undefined;

    // Sync orders
    if (type === 'all' || type === 'orders') {
      result.orders = await syncOrders(loja.id, loja.dominio, loja.access_token, sinceDate);
    }

    // Sync products
    if (type === 'all' || type === 'products') {
      result.products = await syncProducts(loja.id, loja.dominio, loja.access_token);
    }

    // Sync customers
    if (type === 'all' || type === 'customers') {
      result.customers = await syncCustomers(loja.id, loja.dominio, loja.access_token);
    }

    // Update last sync timestamp
    await prisma.lojaShopify.update({
      where: { id: loja.id },
      data: { last_sync_at: new Date() },
    });

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao sincronizar';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET endpoint for cron sync
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const lojas = await prisma.lojaShopify.findMany({
      where: { auto_sync: true, ativa: true },
    });

    const results = [];
    for (const loja of lojas) {
      try {
        const sinceDate = loja.last_sync_at?.toISOString() || undefined;
        const orders = await syncOrders(loja.id, loja.dominio, loja.access_token, sinceDate);
        const products = await syncProducts(loja.id, loja.dominio, loja.access_token);
        const customers = await syncCustomers(loja.id, loja.dominio, loja.access_token);

        await prisma.lojaShopify.update({
          where: { id: loja.id },
          data: { last_sync_at: new Date() },
        });

        results.push({ loja_id: loja.id, nome: loja.nome_loja, orders, products, customers });
      } catch (err) {
        results.push({
          loja_id: loja.id,
          nome: loja.nome_loja,
          status: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({ synced: results.length, results });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao sincronizar lojas' }, { status: 500 });
  }
}

async function syncOrders(lojaId: number, dominio: string, accessToken: string, sinceDate?: string) {
  const orders = await fetchShopifyOrders(dominio, accessToken, sinceDate);

  let created = 0;
  let updated = 0;

  for (const order of orders) {
    const existing = await prisma.pedidoShopify.findUnique({
      where: { shopify_order_id: order.shopify_order_id },
    });

    if (existing) {
      await prisma.pedidoShopify.update({
        where: { id: existing.id },
        data: {
          valor_total: order.valor_total,
          valor_subtotal: order.valor_subtotal,
          valor_desconto: order.valor_desconto,
          valor_frete: order.valor_frete,
          valor_impostos: order.valor_impostos,
          status_financeiro: order.status_financeiro,
          status_fulfillment: order.status_fulfillment,
          itens_json: order.itens_json,
          quantidade_itens: order.quantidade_itens,
          tags: order.tags,
        },
      });
      updated++;
    } else {
      await prisma.pedidoShopify.create({
        data: {
          loja_id: lojaId,
          ...order,
          data_pedido: new Date(order.data_pedido),
        },
      });
      created++;
    }
  }

  return { created, updated, total: orders.length };
}

async function syncProducts(lojaId: number, dominio: string, accessToken: string) {
  const products = await fetchShopifyProducts(dominio, accessToken);

  let created = 0;
  let updated = 0;

  for (const product of products) {
    const existing = await prisma.produtoShopify.findUnique({
      where: { shopify_product_id: product.shopify_product_id },
    });

    if (existing) {
      await prisma.produtoShopify.update({
        where: { id: existing.id },
        data: {
          titulo: product.titulo,
          tipo_produto: product.tipo_produto,
          vendor: product.vendor,
          status: product.status,
          tags: product.tags,
          preco_min: product.preco_min,
          preco_max: product.preco_max,
          estoque_total: product.estoque_total,
          variantes_json: product.variantes_json,
          quantidade_variantes: product.quantidade_variantes,
          imagem_url: product.imagem_url,
        },
      });
      updated++;
    } else {
      await prisma.produtoShopify.create({
        data: {
          loja_id: lojaId,
          ...product,
        },
      });
      created++;
    }
  }

  return { created, updated, total: products.length };
}

async function syncCustomers(lojaId: number, dominio: string, accessToken: string) {
  const customers = await fetchShopifyCustomers(dominio, accessToken);

  let created = 0;
  let updated = 0;

  for (const customer of customers) {
    const existing = await prisma.clienteShopify.findUnique({
      where: { shopify_customer_id: customer.shopify_customer_id },
    });

    if (existing) {
      await prisma.clienteShopify.update({
        where: { id: existing.id },
        data: {
          nome: customer.nome,
          email: customer.email,
          telefone: customer.telefone,
          cidade: customer.cidade,
          estado: customer.estado,
          pais: customer.pais,
          total_pedidos: customer.total_pedidos,
          total_gasto: customer.total_gasto,
          tags: customer.tags,
        },
      });
      updated++;
    } else {
      await prisma.clienteShopify.create({
        data: {
          loja_id: lojaId,
          ...customer,
        },
      });
      created++;
    }
  }

  return { created, updated, total: customers.length };
}
