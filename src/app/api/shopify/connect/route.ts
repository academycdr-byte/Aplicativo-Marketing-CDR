import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { normalizeStoreDomain, verifyShopifyConnection } from '@/lib/shopify';

export async function POST(request: NextRequest) {
  try {
    const { dominio, access_token } = await request.json();

    if (!dominio || !access_token) {
      return NextResponse.json(
        { error: 'Dominio e access_token sao obrigatorios' },
        { status: 400 }
      );
    }

    const normalizedDomain = normalizeStoreDomain(dominio);

    // Verify connection with Shopify API
    const shopInfo = await verifyShopifyConnection(normalizedDomain, access_token);

    // Check if store already exists
    const existing = await prisma.lojaShopify.findUnique({
      where: { dominio: normalizedDomain },
    });

    let loja;
    if (existing) {
      // Update existing store
      loja = await prisma.lojaShopify.update({
        where: { id: existing.id },
        data: {
          nome_loja: shopInfo.name,
          access_token: access_token,
          moeda: shopInfo.currency || 'BRL',
          email_loja: shopInfo.email || '',
          plano: shopInfo.plan_name || '',
          ativa: true,
        },
      });
    } else {
      // Create new store
      loja = await prisma.lojaShopify.create({
        data: {
          nome_loja: shopInfo.name,
          dominio: normalizedDomain,
          access_token: access_token,
          moeda: shopInfo.currency || 'BRL',
          email_loja: shopInfo.email || '',
          plano: shopInfo.plan_name || '',
        },
      });
    }

    // Return without exposing access_token
    return NextResponse.json({
      success: true,
      loja: {
        id: loja.id,
        nome_loja: loja.nome_loja,
        dominio: loja.dominio,
        moeda: loja.moeda,
        email_loja: loja.email_loja,
        plano: loja.plano,
        ativa: loja.ativa,
        auto_sync: loja.auto_sync,
        last_sync_at: loja.last_sync_at,
        created_at: loja.created_at,
      },
      isUpdate: !!existing,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao conectar loja';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
