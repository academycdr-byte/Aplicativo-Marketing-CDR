import { NextRequest, NextResponse } from 'next/server';
import { refreshLongLivedToken } from '@/lib/instagram';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Step 1: Refresh tokens that expire within 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const contasToRefresh = await prisma.contaSocial.findMany({
      where: {
        access_token: { not: null },
        token_expires_at: { lt: sevenDaysFromNow, gt: new Date() },
      },
    });

    for (const conta of contasToRefresh) {
      try {
        const refreshed = await refreshLongLivedToken(conta.access_token!);
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + refreshed.expires_in);
        await prisma.contaSocial.update({
          where: { id: conta.id },
          data: { access_token: refreshed.access_token, token_expires_at: expiresAt },
        });
      } catch {}
    }

    // Step 2: Trigger sync for all auto-sync accounts
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const syncRes = await fetch(`${appUrl}/api/instagram/sync`, {
      headers: cronSecret ? { authorization: `Bearer ${cronSecret}` } : {},
    });
    const syncResult = await syncRes.json();

    return NextResponse.json({
      tokens_refreshed: contasToRefresh.length,
      sync: syncResult,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro no cron' }, { status: 500 });
  }
}
