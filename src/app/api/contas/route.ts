import { NextRequest, NextResponse } from 'next/server';
import { getContasSociais, createContaSocial, updateContaSocial, deleteContaSocial } from '@/lib/database';

export async function GET() {
  try {
    const contas = getContasSociais();
    return NextResponse.json(contas);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao carregar contas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const conta = createContaSocial(data);
    return NextResponse.json(conta, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...rest } = data;
    const conta = updateContaSocial(id, rest);
    return NextResponse.json(conta);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar conta' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    deleteContaSocial(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar conta' }, { status: 500 });
  }
}
