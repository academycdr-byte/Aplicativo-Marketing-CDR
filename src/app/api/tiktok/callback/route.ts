import { NextRequest, NextResponse } from 'next/server';
import { exchangeTikTokCode, getTikTokProfile } from '@/lib/tiktok';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/contas?error=tiktok_auth_failed', request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/contas?error=no_code', request.url));
    }

    try {
        // 1. Exchange code for access token
        const tokenData = await exchangeTikTokCode(code);

        // 2. Fetch user profile
        const userProfile = await getTikTokProfile(tokenData.access_token);

        // 3. Save to database
        // Check if account already exists
        const existingAccount = await prisma.contaSocial.findFirst({
            where: {
                plataforma: 'tiktok',
                tiktok_user_id: tokenData.open_id,
            },
        });

        if (existingAccount) {
            await prisma.contaSocial.update({
                where: { id: existingAccount.id },
                data: {
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token,
                    token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000),
                    nome_perfil: userProfile.display_name,
                    username: userProfile.username,
                    avatar_url: userProfile.avatar_url,
                    seguidores: userProfile.follower_count,
                    ativa: true,
                },
            });
        } else {
            await prisma.contaSocial.create({
                data: {
                    plataforma: 'tiktok',
                    tiktok_user_id: tokenData.open_id,
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token,
                    token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000),
                    nome_perfil: userProfile.display_name,
                    username: userProfile.username,
                    avatar_url: userProfile.avatar_url,
                    seguidores: userProfile.follower_count,
                    ativa: true,
                },
            });
        }

        return NextResponse.redirect(new URL('/contas?success=tiktok_connected', request.url));

    } catch (error) {
        console.error('TikTok Auth Error:', error);
        return NextResponse.redirect(new URL('/contas?error=tiktok_exception', request.url));
    }
}
