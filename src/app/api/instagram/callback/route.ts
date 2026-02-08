import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getLongLivedToken, getConnectedProfiles } from '@/lib/instagram';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorReason = searchParams.get('error_reason');
  const errorDescription = searchParams.get('error_description');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(`${appUrl}/contas?error=${encodeURIComponent(errorDescription || errorReason || 'Erro no login do Facebook')}`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/contas?error=missing_params`);
  }

  try {
    // 1. Exchange code for short-lived User Token (Facebook)
    const shortToken = await exchangeCodeForToken(code);

    // 2. Get long-lived User Token (60 days)
    const longToken = await getLongLivedToken(shortToken.access_token);

    // 3. Get ALL Instagram Business Profiles (via Pages)
    const profiles = await getConnectedProfiles(longToken.access_token);

    if (profiles.length === 0) {
      throw new Error('Nenhuma conta do Instagram Business conectada às Páginas deste Facebook.');
    }

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (longToken.expires_in || 5184000));

    console.log(`[Instagram Callback] Found ${profiles.length} profiles:`, profiles.map(p => p.username));

    // Iterate through all found profiles and save/update them
    for (const profile of profiles) {
      console.log(`[Instagram Callback] Processing profile: ${profile.username} (${profile.ig_user_id})`);
      const igData = {
        ig_user_id: profile.ig_user_id,
        access_token: longToken.access_token,
        token_expires_at: expiresAt,
        auto_sync: true,
        nome_perfil: profile.name, // Name of the Page or User
        username: profile.username,
        avatar_url: profile.profile_picture_url,
        seguidores: profile.followers_count,
      };

      // Check if account with this ig_user_id already exists
      const existing = await prisma.contaSocial.findFirst({
        where: { ig_user_id: profile.ig_user_id },
      });

      if (existing) {
        console.log(`[Instagram Callback] Updating existing account ${existing.id}`);
        await prisma.contaSocial.update({
          where: { id: existing.id },
          data: igData,
        });
      } else {
        console.log(`[Instagram Callback] Creating new account for ${profile.username}`);
        await prisma.contaSocial.create({
          data: {
            plataforma: 'instagram',
            ...igData,
          },
        });
      }
    }

    return NextResponse.redirect(`${appUrl}/contas?success=connected&count=${profiles.length}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Instagram Callback Error:', error);
    // User-friendly error mapping
    let userMsg = msg;
    if (msg.includes('Nenhuma conta do Instagram Business conectada')) {
      userMsg = 'Nenhuma conta do Instagram Empresarial encontrada. Certifique-se de que sua conta do Instagram é Comercial/Criador e está conectada a uma Página do Facebook.';
    }
    return NextResponse.redirect(`${appUrl}/contas?error=${encodeURIComponent(userMsg)}`);
  }
}
