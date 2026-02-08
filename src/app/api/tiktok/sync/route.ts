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
    if (!conta || !conta.tiktok_open_id || !conta.tiktok_token) {
      return NextResponse.json({ error: 'Conta nao conectada ao TikTok' }, { status: 400 });
    }

    // Refresh token if expired
    let accessToken = conta.tiktok_token;
    if (conta.tiktok_expires_at && conta.tiktok_expires_at < new Date() && conta.tiktok_refresh) {
      try {
        const refreshed = await refreshTikTokToken(conta.tiktok_refresh);
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + refreshed.expires_in);
        await prisma.contaSocial.update({
          where: { id: conta.id },
          data: {
            tiktok_token: refreshed.access_token,
            tiktok_refresh: refreshed.refresh_token,
            tiktok_expires_at: expiresAt,
            access_token: refreshed.access_token,
            token_expires_at: expiresAt,
          },
        });
        accessToken = refreshed.access_token;
      } catch {
        return NextResponse.json({ error: 'Token expirado. Reconecte a conta.' }, { status: 401 });
      }
    }

    const result = await syncTikTokAccount(conta.id, accessToken);

    await prisma.contaSocial.update({
      where: { id: conta.id },
      data: { last_sync_at: new Date() },
    });

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao sincronizar';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function syncTikTokAccount(contaId: number, accessToken: string) {
  const videos = await fetchTikTokVideos(accessToken);

  let defaultColaborador = await prisma.colaborador.findFirst({ where: { ativo: true }, orderBy: { id: 'asc' } });
  if (!defaultColaborador) {
    defaultColaborador = await prisma.colaborador.create({
      data: { nome: 'Auto Sync', email: 'sync@cdr.com', cargo: 'TikTok Auto' },
    });
  }

  let created = 0;
  let updated = 0;

  for (const video of videos) {
    const existing = await prisma.postagem.findUnique({ where: { external_id: video.external_id } });

    if (existing) {
      await prisma.postagem.update({
        where: { id: existing.id },
        data: {
          visualizacoes: video.visualizacoes,
          curtidas: video.curtidas,
          comentarios: video.comentarios,
          compartilhamentos: video.compartilhamentos,
        },
      });
      updated++;
    } else {
      await prisma.postagem.create({
        data: {
          conta_id: contaId,
          colaborador_id: defaultColaborador.id,
          titulo: video.titulo,
          url: video.url,
          thumbnail_url: video.thumbnail_url,
          categoria: video.categoria,
          visualizacoes: video.visualizacoes,
          curtidas: video.curtidas,
          comentarios: video.comentarios,
          compartilhamentos: video.compartilhamentos,
          data_postagem: new Date(video.data_postagem),
          external_id: video.external_id,
        },
      });
      created++;
    }
  }

  return { status: 'ok', created, updated, total: videos.length };
}
