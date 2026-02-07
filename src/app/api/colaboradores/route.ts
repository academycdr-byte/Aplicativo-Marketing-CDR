import { NextRequest, NextResponse } from 'next/server';
import { getColaboradores, createColaborador, updateColaborador, deleteColaborador } from '@/lib/database';

export async function GET() {
  try {
    const colaboradores = await getColaboradores();
    return NextResponse.json(colaboradores);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao carregar colaboradores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const colaborador = await createColaborador(data);
    return NextResponse.json(colaborador, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar colaborador' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...rest } = data;
    const colaborador = await updateColaborador(id, rest);
    return NextResponse.json(colaborador);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar colaborador' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    await deleteColaborador(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar colaborador' }, { status: 500 });
  }
}
