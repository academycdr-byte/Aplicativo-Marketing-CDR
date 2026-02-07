import { NextRequest, NextResponse } from 'next/server';
import { getOAuthUrl } from '@/lib/instagram';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contaId = searchParams.get('conta_id') || 'new';

  if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
    return NextResponse.json({ error: 'Meta App nao configurado. Adicione META_APP_ID e META_APP_SECRET nas variaveis de ambiente.' }, { status: 500 });
  }

  const url = getOAuthUrl(contaId);
  return NextResponse.redirect(url);
}
