import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/database';

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao carregar dashboard' }, { status: 500 });
  }
}
