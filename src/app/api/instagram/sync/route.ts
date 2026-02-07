import { NextRequest, NextResponse } from 'next/server';
import { fetchInstagramMedia } from '@/lib/instagram';
import { prisma } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { conta_id } = await request.json();

    if (!conta_id) {
      return NextResponse.json({ error: 'conta_id obrigatorio' }, { status: 400 });
    }

    const conta = await prisma.contaSocial.findUnique({ where: { id: conta_id } });
    if (!conta || !conta.ig_user_id || !conta.access_token) {
      return NextResponse.json({ error: 'Conta nao conectada ao Instagram' }, { status: 400 });
    }

    // Check if token is expired
    if (conta.token_expires_at && conta.token_expires_at < new Date()) {
      return NextResponse.json({ error: 'Token expirado. Reconecte a conta.' }, { status: 401 });
    }

    const result = await syncAccount(conta.id, conta.ig_user_id, conta.access_token);

    // Update last sync timestamp
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

// Also support GET for syncing all accounts (used by cron)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Verify cron secret if set
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const contas = await prisma.contaSocial.findMany({
      where: {
        auto_sync: true,
        ig_user_id: { not: null },
        access_token: { not: null },
      },
    });

    const results = [];
    for (const conta of contas) {
      if (conta.token_expires_at && conta.token_expires_at < new Date()) {
        results.push({ conta_id: conta.id, status: 'token_expired' });
        continue;
      }

      try {
        const result = await syncAccount(conta.id, conta.ig_user_id!, conta.access_token!);
        await prisma.contaSocial.update({
          where: { id: conta.id },
          data: { last_sync_at: new Date() },
        });
        results.push({ conta_id: conta.id, ...result });
      } catch (err) {
        results.push({ conta_id: conta.id, status: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    return NextResponse.json({ synced: results.length, results });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao sincronizar contas' }, { status: 500 });
  }
}

async function syncAccount(contaId: number, igUserId: string, accessToken: string) {
  const posts = await fetchInstagramMedia(igUserId, accessToken);

  // Get or create a default collaborator for auto-synced posts
  let defaultColaborador = await prisma.colaborador.findFirst({ where: { ativo: true }, orderBy: { id: 'asc' } });
  if (!defaultColaborador) {
    defaultColaborador = await prisma.colaborador.create({
      data: { nome: 'Auto Sync', email: 'sync@cdr.com', cargo: 'Instagram Auto' },
    });
  }

  let created = 0;
  let updated = 0;

  for (const post of posts) {
    const existing = await prisma.postagem.findUnique({ where: { external_id: post.external_id } });

    if (existing) {
      // Update metrics
      await prisma.postagem.update({
        where: { id: existing.id },
        data: {
          visualizacoes: post.visualizacoes,
          curtidas: post.curtidas,
          comentarios: post.comentarios,
          compartilhamentos: post.compartilhamentos,
        },
      });
      updated++;
    } else {
      // Create new post
      await prisma.postagem.create({
        data: {
          conta_id: contaId,
          colaborador_id: defaultColaborador.id,
          titulo: post.titulo,
          url: post.url,
          thumbnail_url: post.thumbnail_url,
          categoria: post.categoria,
          visualizacoes: post.visualizacoes,
          curtidas: post.curtidas,
          comentarios: post.comentarios,
          compartilhamentos: post.compartilhamentos,
          data_postagem: new Date(post.data_postagem),
          external_id: post.external_id,
        },
      });
      created++;
    }
  }

  return { status: 'ok', created, updated, total: posts.length };
}
