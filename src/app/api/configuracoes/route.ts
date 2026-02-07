import { NextRequest, NextResponse } from 'next/server';
import { getConfiguracoesCPM, updateConfiguracaoCPM } from '@/lib/database';

export async function GET() {
  try {
    const configuracoes = await getConfiguracoesCPM();
    return NextResponse.json(configuracoes);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao carregar configuracoes' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { categoria, valor_por_cpm } = await request.json();
    const config = await updateConfiguracaoCPM(categoria, valor_por_cpm);
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar configuracao' }, { status: 500 });
  }
}
