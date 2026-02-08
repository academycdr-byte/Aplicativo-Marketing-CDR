import { NextRequest, NextResponse } from 'next/server';
import { fetchTikTokVideos, refreshTikTokToken } from '@/lib/tiktok';
import { prisma } from '@/lib/database';

export async function POST(request: NextRequest) {
    try {
        const { conta_id } = await request.json();

        if (!conta_id) {
            return NextResponse.json({ error: 'conta_id obrigatorio' }, { status: 400 });
        }

        const conta = await prisma.contaSocial.findUnique({ where: { id: conta_id } });
        if (!conta || !conta.tiktok_user_id || !conta.access_token) {
            return NextResponse.json({ error: 'Conta nao conectada ao TikTok' }, { status: 400 });
        }

        let accessToken = conta.access_token;
        let refreshToken = conta.refresh_token;

        // Check if token is expired or about to expire (buffer of 5 minutes)
        if (conta.token_expires_at && new Date(conta.token_expires_at.getTime() - 5 * 60000) < new Date()) {
            if (!refreshToken) {
                return NextResponse.json({ error: 'Token expirado e sem refresh token. Reconecte a conta.' }, { status: 401 });
            }

            try {
                console.log(`[TikTok Sync] Refreshing token for account ${conta.id}`);
                const newTokens = await refreshTikTokToken(refreshToken);

                accessToken = newTokens.access_token;
                refreshToken = newTokens.refresh_token;

                // Update DB with new tokens
                await prisma.contaSocial.update({
                    where: { id: conta.id },
                    data: {
                        access_token: accessToken,
                        refresh_token: refreshToken,
                        token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000),
                    },
                });
            } catch (refreshError) {
                console.error('Failed to refresh TikTok token:', refreshError);
                return NextResponse.json({ error: 'Falha ao renovar token. Reconecte a conta.' }, { status: 401 });
            }
        }

        const result = await syncAccount(conta.id, accessToken);

        // Update last sync timestamp
        await prisma.contaSocial.update({
            where: { id: conta.id },
            data: { last_sync_at: new Date() },
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('TikTok Sync Error:', error);
        const msg = error instanceof Error ? error.message : 'Erro ao sincronizar TikTok';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

async function syncAccount(contaId: number, accessToken: string) {
    // Fetch videos (first page only for now, can loop if needed)
    const { videos } = await fetchTikTokVideos(accessToken);

    // Get or create a default collaborator for auto-synced posts
    let defaultColaborador = await prisma.colaborador.findFirst({ where: { ativo: true }, orderBy: { id: 'asc' } });
    if (!defaultColaborador) {
        defaultColaborador = await prisma.colaborador.create({
            data: { nome: 'Auto Sync', email: 'sync@cdr.com', cargo: 'TikTok Auto' },
        });
    }

    let created = 0;
    let updated = 0;

    for (const video of videos) {
        const videoId = video.id;
        const existing = await prisma.postagem.findUnique({ where: { external_id: videoId } });

        // Default URL structure if share_url is missing
        const videoUrl = video.share_url || `https://www.tiktok.com/@user/video/${videoId}`;

        if (existing) {
            // Update metrics
            await prisma.postagem.update({
                where: { id: existing.id },
                data: {
                    visualizacoes: video.view_count,
                    curtidas: video.like_count,
                    comentarios: video.comment_count,
                    compartilhamentos: video.share_count,
                },
            });
            updated++;
        } else {
            // Create new post
            await prisma.postagem.create({
                data: {
                    conta_id: contaId,
                    colaborador_id: defaultColaborador.id,
                    titulo: video.title || video.video_description || 'Sem titulo',
                    url: videoUrl,
                    thumbnail_url: video.cover_image_url || '',
                    categoria: 'Reels/TikTok', // Standard category
                    visualizacoes: video.view_count,
                    curtidas: video.like_count,
                    comentarios: video.comment_count,
                    compartilhamentos: video.share_count,
                    data_postagem: new Date(video.create_time * 1000), // TikTok returns unix timestamp in seconds
                    external_id: videoId,
                },
            });
            created++;
        }
    }

    return { status: 'ok', created, updated, total: videos.length };
}
