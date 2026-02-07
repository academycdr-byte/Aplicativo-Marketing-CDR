const META_API = 'https://graph.facebook.com/v21.0';
const META_APP_ID = process.env.META_APP_ID!;
const META_APP_SECRET = process.env.META_APP_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function getOAuthUrl(contaId: string | number): string {
  const redirectUri = `${APP_URL}/api/instagram/callback`;
  const scopes = [
    'instagram_basic',
    'instagram_manage_insights',
    'pages_show_list',
    'pages_read_engagement',
  ].join(',');

  return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${contaId}`;
}

export async function exchangeCodeForToken(code: string): Promise<{ access_token: string; expires_in: number }> {
  const redirectUri = `${APP_URL}/api/instagram/callback`;
  const url = `${META_API}/oauth/access_token?client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to exchange code for token');
  return res.json();
}

export async function getLongLivedToken(shortToken: string): Promise<{ access_token: string; expires_in: number }> {
  const url = `${META_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortToken}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to get long-lived token');
  return res.json();
}

export async function refreshLongLivedToken(token: string): Promise<{ access_token: string; expires_in: number }> {
  const url = `${META_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${token}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to refresh token');
  return res.json();
}

export async function getInstagramAccount(accessToken: string): Promise<{ ig_user_id: string; name: string; username: string; profile_picture_url: string; followers_count: number }> {
  // Get Facebook Pages
  const pagesRes = await fetch(`${META_API}/me/accounts?access_token=${accessToken}`);
  if (!pagesRes.ok) throw new Error('Failed to get pages');
  const pagesData = await pagesRes.json();

  if (!pagesData.data || pagesData.data.length === 0) {
    throw new Error('Nenhuma pagina do Facebook encontrada. Conecte uma pagina ao seu Instagram Business.');
  }

  // Get Instagram Business Account from the first page
  const pageId = pagesData.data[0].id;
  const igRes = await fetch(`${META_API}/${pageId}?fields=instagram_business_account&access_token=${accessToken}`);
  if (!igRes.ok) throw new Error('Failed to get Instagram account');
  const igData = await igRes.json();

  if (!igData.instagram_business_account) {
    throw new Error('Nenhuma conta Instagram Business conectada a esta pagina do Facebook.');
  }

  const igUserId = igData.instagram_business_account.id;

  // Get Instagram profile info
  const profileRes = await fetch(`${META_API}/${igUserId}?fields=name,username,profile_picture_url,followers_count&access_token=${accessToken}`);
  if (!profileRes.ok) throw new Error('Failed to get Instagram profile');
  const profile = await profileRes.json();

  return {
    ig_user_id: igUserId,
    name: profile.name || profile.username,
    username: profile.username,
    profile_picture_url: profile.profile_picture_url || '',
    followers_count: profile.followers_count || 0,
  };
}

interface IGMedia {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
}

interface IGInsights {
  impressions?: number;
  reach?: number;
  shares?: number;
  plays?: number;
  video_views?: number;
}

export interface SyncedPost {
  external_id: string;
  titulo: string;
  url: string;
  thumbnail_url: string;
  categoria: string;
  visualizacoes: number;
  curtidas: number;
  comentarios: number;
  compartilhamentos: number;
  data_postagem: string;
}

export async function fetchInstagramMedia(igUserId: string, accessToken: string): Promise<SyncedPost[]> {
  const mediaFields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count';
  const url = `${META_API}/${igUserId}/media?fields=${mediaFields}&limit=50&access_token=${accessToken}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch media');
  const data = await res.json();

  if (!data.data) return [];

  const posts: SyncedPost[] = [];

  for (const media of data.data as IGMedia[]) {
    // Get insights for each media
    let insights: IGInsights = {};
    try {
      const isVideo = ['VIDEO', 'REEL'].includes(media.media_type);
      const metrics = isVideo
        ? 'impressions,reach,shares,plays'
        : 'impressions,reach,shares';

      const insightsRes = await fetch(
        `${META_API}/${media.id}/insights?metric=${metrics}&access_token=${accessToken}`
      );
      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        if (insightsData.data) {
          for (const metric of insightsData.data) {
            insights[metric.name as keyof IGInsights] = metric.values?.[0]?.value || 0;
          }
        }
      }
    } catch {
      // Insights may not be available for all media types
    }

    const isReel = media.media_type === 'REEL' || media.media_type === 'VIDEO';
    const views = insights.plays || insights.impressions || insights.reach || 0;

    posts.push({
      external_id: media.id,
      titulo: (media.caption || '').slice(0, 200) || `Post ${media.media_type}`,
      url: media.permalink || '',
      thumbnail_url: media.thumbnail_url || media.media_url || '',
      categoria: isReel ? 'viral' : 'tecnico',
      visualizacoes: views,
      curtidas: media.like_count || 0,
      comentarios: media.comments_count || 0,
      compartilhamentos: insights.shares || 0,
      data_postagem: media.timestamp.split('T')[0],
    });
  }

  return posts;
}
