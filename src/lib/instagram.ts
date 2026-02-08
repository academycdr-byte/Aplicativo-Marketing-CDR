// Facebook Login for Instagram Business (Updated 2026)
// Docs: https://developers.facebook.com/docs/instagram/business-login-for-instagram

const FB_API = 'https://graph.facebook.com';
const META_APP_ID = process.env.META_APP_ID!;
const META_APP_SECRET = process.env.META_APP_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function getOAuthUrl(state: string | number): string {
  const redirectUri = `${APP_URL}/api/instagram/callback`;
  const scopes = [
    'instagram_basic',
    'instagram_manage_insights',
    'instagram_manage_comments',
    'instagram_content_publish',
    'pages_show_list',
    'pages_read_engagement',
    'business_management' // Often needed to list pages
  ].join(',');

  // Use Facebook Login Dialog instead of Instagram Basic Display
  return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${state}`;
}

export async function exchangeCodeForToken(code: string): Promise<{ access_token: string; expires_in: number }> {
  const redirectUri = `${APP_URL}/api/instagram/callback`;

  // Exchange code for User Access Token
  const res = await fetch(`${FB_API}/v21.0/oauth/access_token`, {
    method: 'GET', // Facebook uses GET for token exchange
    headers: { 'Content-Type': 'application/json' },
  })
  // Since fetch doesn't support params in GET body, append to URL manually or use URLSearchParams
  // But wait, the standard way is query params for GET
  const tokenUrl = `${FB_API}/v21.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${META_APP_SECRET}&code=${code}`;

  const tokenRes = await fetch(tokenUrl);

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Failed to exchange code: ${err}`);
  }
  return tokenRes.json();
}

export async function getLongLivedToken(shortToken: string): Promise<{ access_token: string; expires_in: number }> {
  const url = `${FB_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortToken}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to get long-lived token: ${err}`);
  }
  return res.json();
}

// Note: Facebook tokens expire in about 60 days but are refreshed automatically when used?
// Actually we need to check if we can refresh them explicitly.
export async function refreshLongLivedToken(token: string): Promise<{ access_token: string; expires_in: number }> {
  // For FB User Tokens, we just get a new one via the same exchange flow or check validity?
  // Actually, FB User tokens are portable.
  // But let's keep the signature compatible.
  return { access_token: token, expires_in: 5184000 }; // Mock refresh for now as FB handles this differently
}

export async function getInstagramProfile(accessToken: string): Promise<{
  ig_user_id: string;
  name: string;
  username: string;
  profile_picture_url: string;
  followers_count: number;
}> {
  // 1. Get User's Pages which have an Instagram Business Account connected
  const fields = 'name,instagram_business_account{id,username,profile_picture_url,followers_count}';
  const pagesUrl = `${FB_API}/v21.0/me/accounts?fields=${fields}&access_token=${accessToken}`;

  const res = await fetch(pagesUrl);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch pages: ${err}`);
  }

  const data = await res.json();

  // Find the first page with a connected IG Business Account
  const pageWithIg = data.data?.find((p: any) => p.instagram_business_account);

  if (!pageWithIg) {
    throw new Error('Nenhuma conta do Instagram Business conectada às Páginas do Facebook deste usuário.');
  }

  const igAccount = pageWithIg.instagram_business_account;

  return {
    ig_user_id: igAccount.id,
    name: pageWithIg.name, // Use Page name as fallback
    username: igAccount.username,
    profile_picture_url: igAccount.profile_picture_url || '',
    followers_count: igAccount.followers_count || 0,
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
  // First, we need the IG Business ID.
  const profile = await getInstagramProfile(accessToken);
  const igUserId = profile.ig_user_id;

  const mediaFields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count';
  const url = `${FB_API}/v21.0/${igUserId}/media?fields=${mediaFields}&limit=50&access_token=${accessToken}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text();
    console.error('Error fetching media list:', err);
    throw new Error(`Failed to fetch media: ${err}`);
  }
  const data = await res.json();

  if (!data.data) return [];

  const posts: SyncedPost[] = [];

  for (const media of data.data as IGMedia[]) {
    // Get insights for each media
    let insights: IGInsights = {};
    const isVideo = ['VIDEO', 'REEL'].includes(media.media_type);

    // Strategy: Fetch "safe" metrics first (Reach/Impressions)
    // 'shares' and 'plays' can sometimes cause errors depending on account status or media age

    try {
      // 1. Basic Views Metrics
      const basicMetric = isVideo ? 'reach,plays' : 'reach,impressions';
      const basicRes = await fetch(
        `${FB_API}/v21.0/${media.id}/insights?metric=${basicMetric}&access_token=${accessToken}`
      );

      if (basicRes.ok) {
        const basicData = await basicRes.json();
        if (basicData.data) {
          for (const metric of basicData.data) {
            insights[metric.name as keyof IGInsights] = metric.values?.[0]?.value || 0;
          }
        }
      } else {
        // Fallback: Try just 'reach' if the combo failed
        const fallbackRes = await fetch(
          `${FB_API}/v21.0/${media.id}/insights?metric=reach&access_token=${accessToken}`
        );
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData.data) {
            insights.reach = fallbackData.data[0]?.values?.[0]?.value || 0;
          }
        } else {
          console.warn(`Failed to fetch basic metrics for ${media.id}:`, await basicRes.text());
        }
      }

      // 2. Engagement Metrics (Shares) - Attempt separately
      try {
        // Shares often fail for older posts or specific types
        const shareRes = await fetch(
          `${FB_API}/v21.0/${media.id}/insights?metric=shares&access_token=${accessToken}`
        );
        if (shareRes.ok) {
          const shareData = await shareRes.json();
          if (shareData.data) {
            insights.shares = shareData.data[0]?.values?.[0]?.value || 0;
          }
        }
      } catch (e) {
        // Ignore share errors
        console.warn(`Failed to fetch shares for ${media.id}`);
      }

    } catch (error) {
      console.error(`Unexpected error fetching insights for ${media.id}:`, error);
    }

    const views = insights.plays || insights.impressions || insights.reach || 0;
    const shares = insights.shares || 0;

    posts.push({
      external_id: media.id,
      titulo: (media.caption || '').slice(0, 200) || `Post ${media.media_type}`,
      url: media.permalink || '',
      thumbnail_url: media.thumbnail_url || media.media_url || '',
      categoria: isVideo ? 'viral' : 'tecnico',
      visualizacoes: views,
      curtidas: media.like_count || 0,
      comentarios: media.comments_count || 0,
      compartilhamentos: shares,
      data_postagem: media.timestamp.split('T')[0],
    });
  }

  return posts;
}
