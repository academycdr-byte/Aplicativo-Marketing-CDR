import { NextRequest, NextResponse } from 'next/server';
import { exchangeTikTokCode, getTikTokProfile } from '@/lib/tiktok';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!code) {
    const error = searchParams.get('error') || 'missing_code';
    return NextResponse.redirect(`${appUrl}/contas?error=${encodeURIComponent(error)}`);
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeTikTokCode(code);

    // Get TikTok profile
    const profile = await getTikTokProfile(tokens.access_token);

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    const tiktokData = {
      tiktok_open_id: tokens.open_id || profile.open_id,
      tiktok_token: tokens.access_token,
      tiktok_refresh: tokens.refresh_token,
      tiktok_expires_at: expiresAt,
      access_token: tokens.access_token,
      token_expires_at: expiresAt,
      auto_sync: true,
      nome_perfil: profile.display_name,
      username: profile.username,
      avatar_url: profile.avatar_url,
      seguidores: profile.follower_count,
    };

    if (state && state !== 'new') {
      // Update existing account
      await prisma.contaSocial.update({
        where: { id: parseInt(state) },
        data: tiktokData,
      });
    } else {
      // Check if account already exists
      const existing = await prisma.contaSocial.findFirst({
        where: { tiktok_open_id: tokens.open_id || profile.open_id },
      });

      if (existing) {
        await prisma.contaSocial.update({
          where: { id: existing.id },
          data: tiktokData,
        });
      } else {
        await prisma.contaSocial.create({
          data: {
            plataforma: 'tiktok',
            ...tiktokData,
          },
        });
      }
    }

    return NextResponse.redirect(`${appUrl}/contas?success=tiktok_connected`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.redirect(`${appUrl}/contas?error=${encodeURIComponent(msg)}`);
  }
}
