import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getLongLivedToken, getInstagramAccount } from '@/lib/instagram';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const contaId = searchParams.get('state');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!code || !contaId) {
    return NextResponse.redirect(`${appUrl}/contas?error=missing_params`);
  }

  try {
    // Exchange code for short-lived token
    const shortToken = await exchangeCodeForToken(code);

    // Get long-lived token (60 days)
    const longToken = await getLongLivedToken(shortToken.access_token);

    // Get Instagram Business Account info
    const igAccount = await getInstagramAccount(longToken.access_token);

    // Update the account in the database
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + longToken.expires_in);

    await prisma.contaSocial.update({
      where: { id: parseInt(contaId) },
      data: {
        ig_user_id: igAccount.ig_user_id,
        access_token: longToken.access_token,
        token_expires_at: expiresAt,
        auto_sync: true,
        nome_perfil: igAccount.name,
        username: igAccount.username,
        avatar_url: igAccount.profile_picture_url,
        seguidores: igAccount.followers_count,
      },
    });

    return NextResponse.redirect(`${appUrl}/contas?success=connected`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.redirect(`${appUrl}/contas?error=${encodeURIComponent(msg)}`);
  }
}
