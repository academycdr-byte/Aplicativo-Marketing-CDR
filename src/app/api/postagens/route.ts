import { NextRequest, NextResponse } from 'next/server';
import { getPostagens, createPostagem, updatePostagem, deletePostagem } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: Record<string, string | number> = {};
    if (searchParams.get('conta_id')) filters.conta_id = Number(searchParams.get('conta_id'));
    if (searchParams.get('colaborador_id')) filters.colaborador_id = Number(searchParams.get('colaborador_id'));
    if (searchParams.get('categoria')) filters.categoria = searchParams.get('categoria')!;
    if (searchParams.get('mes')) filters.mes = searchParams.get('mes')!;

    const postagens = await getPostagens(filters);
    return NextResponse.json(postagens);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao carregar postagens' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const postagem = await createPostagem(data);
    return NextResponse.json(postagem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar postagem' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...rest } = data;
    const postagem = await updatePostagem(id, rest);
    return NextResponse.json(postagem);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar postagem' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    await deletePostagem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar postagem' }, { status: 500 });
  }
}
