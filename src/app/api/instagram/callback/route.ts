import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getLongLivedToken, getInstagramProfile } from '@/lib/instagram';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!code) {
    return NextResponse.redirect(`${appUrl}/contas?error=missing_params`);
  }

  try {
    // Exchange code for short-lived token (returns access_token + user_id)
    const shortToken = await exchangeCodeForToken(code);

    // Get long-lived token (60 days)
    const longToken = await getLongLivedToken(shortToken.access_token);

    // Get Instagram profile info
    const profile = await getInstagramProfile(longToken.access_token);

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + longToken.expires_in);

    const igData = {
      ig_user_id: profile.ig_user_id,
      access_token: longToken.access_token,
      token_expires_at: expiresAt,
      auto_sync: true,
      nome_perfil: profile.name,
      username: profile.username,
      avatar_url: profile.profile_picture_url,
      seguidores: profile.followers_count,
    };

    if (state && state !== 'new') {
      // Update existing account
      await prisma.contaSocial.update({
        where: { id: parseInt(state) },
        data: igData,
      });
    } else {
      // Check if account with this ig_user_id already exists
      const existing = await prisma.contaSocial.findFirst({
        where: { ig_user_id: profile.ig_user_id },
      });

      if (existing) {
        await prisma.contaSocial.update({
          where: { id: existing.id },
          data: igData,
        });
      } else {
        await prisma.contaSocial.create({
          data: {
            plataforma: 'instagram',
            ...igData,
          },
        });
      }
    }

    return NextResponse.redirect(`${appUrl}/contas?success=connected`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.redirect(`${appUrl}/contas?error=${encodeURIComponent(msg)}`);
  }
}
