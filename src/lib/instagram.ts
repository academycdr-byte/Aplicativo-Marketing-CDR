// New Instagram API with Instagram Login (2024+)
// Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login

const IG_API = 'https://graph.instagram.com';
const META_APP_ID = process.env.META_APP_ID!;
const META_APP_SECRET = process.env.META_APP_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function getOAuthUrl(state: string | number): string {
  const redirectUri = `${APP_URL}/api/instagram/callback`;
  const scopes = [
    'instagram_business_basic',
    'instagram_business_manage_insights',
  ].join(',');

  return `https://www.instagram.com/oauth/authorize?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${state}`;
}

export async function exchangeCodeForToken(code: string): Promise<{ access_token: string; user_id: string }> {
  const redirectUri = `${APP_URL}/api/instagram/callback`;

  const res = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: META_APP_ID,
      client_secret: META_APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to exchange code: ${err}`);
  }
  return res.json();
}

export async function getLongLivedToken(shortToken: string): Promise<{ access_token: string; expires_in: number }> {
  const url = `${IG_API}/access_token?grant_type=ig_exchange_token&client_secret=${META_APP_SECRET}&access_token=${shortToken}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to get long-lived token: ${err}`);
  }
  return res.json();
}

export async function refreshLongLivedToken(token: string): Promise<{ access_token: string; expires_in: number }> {
  const url = `${IG_API}/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to refresh token: ${err}`);
  }
  return res.json();
}

export async function getInstagramProfile(accessToken: string): Promise<{
  ig_user_id: string;
  name: string;
  username: string;
  profile_picture_url: string;
  followers_count: number;
}> {
  const fields = 'user_id,username,name,profile_picture_url,followers_count';
  const res = await fetch(`${IG_API}/v21.0/me?fields=${fields}&access_token=${accessToken}`);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to get profile: ${err}`);
  }

  const data = await res.json();
  return {
    ig_user_id: String(data.user_id || data.id),
    name: data.name || data.username,
    username: data.username,
    profile_picture_url: data.profile_picture_url || '',
    followers_count: data.followers_count || 0,
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

export async function fetchInstagramMedia(accessToken: string): Promise<SyncedPost[]> {
  const mediaFields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count';
  const url = `${IG_API}/v21.0/me/media?fields=${mediaFields}&limit=50&access_token=${accessToken}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch media: ${err}`);
  }
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
        `${IG_API}/v21.0/${media.id}/insights?metric=${metrics}&access_token=${accessToken}`
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
