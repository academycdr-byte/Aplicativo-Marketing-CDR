import { NextRequest, NextResponse } from 'next/server';
import { getComissoes, calcularComissoes, marcarComissaoPaga, marcarComissaoNaoPaga } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: Record<string, string | number | boolean> = {};
    if (searchParams.get('colaborador_id')) filters.colaborador_id = Number(searchParams.get('colaborador_id'));
    if (searchParams.get('mes')) filters.mes = searchParams.get('mes')!;
    if (searchParams.get('pago') !== null && searchParams.get('pago') !== undefined) {
      const pago = searchParams.get('pago');
      if (pago === 'true' || pago === 'false') filters.pago = pago === 'true';
    }

    const comissoes = await getComissoes(filters);
    return NextResponse.json(comissoes);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao carregar comissoes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, mes, id } = await request.json();

    if (action === 'calcular' && mes) {
      const comissoes = await calcularComissoes(mes);
      return NextResponse.json(comissoes);
    }

    if (action === 'marcar_pago' && id) {
      await marcarComissaoPaga(id);
      return NextResponse.json({ success: true });
    }

    if (action === 'marcar_nao_pago' && id) {
      await marcarComissaoNaoPaga(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acao invalida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao processar comissoes' }, { status: 500 });
  }
}
