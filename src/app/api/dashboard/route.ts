import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inicio = searchParams.get('inicio') || undefined;
    const fim = searchParams.get('fim') || undefined;
    const stats = await getDashboardStats(inicio, fim);
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao carregar dashboard' }, { status: 500 });
  }
}
