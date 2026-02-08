import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  try {
    const lojas = await prisma.lojaShopify.findMany({
      orderBy: { nome_loja: 'asc' },
      select: {
        id: true,
        nome_loja: true,
        dominio: true,
        moeda: true,
        email_loja: true,
        plano: true,
        ativa: true,
        auto_sync: true,
        last_sync_at: true,
        created_at: true,
        _count: {
          select: {
            pedidos: true,
            produtos: true,
            clientes: true,
          },
        },
      },
    });

    // Add computed counts
    const lojasComStats = lojas.map((loja) => ({
      ...loja,
      total_pedidos: loja._count.pedidos,
      total_produtos: loja._count.produtos,
      total_clientes: loja._count.clientes,
      _count: undefined,
    }));

    return NextResponse.json(lojasComStats);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao carregar lojas' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...rest } = data;

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 });
    }

    // Only allow updating safe fields
    const allowedFields: Record<string, unknown> = {};
    if (rest.ativa !== undefined) allowedFields.ativa = rest.ativa;
    if (rest.auto_sync !== undefined) allowedFields.auto_sync = rest.auto_sync;
    if (rest.nome_loja !== undefined) allowedFields.nome_loja = rest.nome_loja;

    const loja = await prisma.lojaShopify.update({
      where: { id },
      data: allowedFields,
    });

    return NextResponse.json({
      id: loja.id,
      nome_loja: loja.nome_loja,
      dominio: loja.dominio,
      ativa: loja.ativa,
      auto_sync: loja.auto_sync,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar loja' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 });
    }

    // Cascade delete is handled by Prisma onDelete: Cascade
    await prisma.lojaShopify.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover loja' }, { status: 500 });
  }
}
