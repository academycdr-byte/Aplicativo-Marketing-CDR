import { NextRequest, NextResponse } from 'next/server';
import { getTikTokOAuthUrl } from '@/lib/tiktok';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contaId = searchParams.get('conta_id') || 'new';

  if (!process.env.TIKTOK_CLIENT_KEY || !process.env.TIKTOK_CLIENT_SECRET) {
    return NextResponse.json({ error: 'TikTok App nao configurado. Adicione TIKTOK_CLIENT_KEY e TIKTOK_CLIENT_SECRET.' }, { status: 500 });
  }

  const url = getTikTokOAuthUrl(contaId);
  return NextResponse.redirect(url);
}
