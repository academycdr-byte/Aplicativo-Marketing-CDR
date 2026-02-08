// TikTok API v2 Integration
// Docs: https://developers.tiktok.com/doc/login-kit-web

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function getTikTokOAuthUrl(state: string | number): string {
  const redirectUri = `${APP_URL}/api/tiktok/callback`;
  const scopes = 'user.info.basic,user.info.profile,user.info.stats,video.list';
  const csrfState = String(state);

  return `https://www.tiktok.com/v2/auth/authorize?client_key=${TIKTOK_CLIENT_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${csrfState}`;
}

interface TikTokTokenResponse {
  access_token: string;
  refresh_token: string;
  open_id: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

export async function exchangeTikTokCode(code: string): Promise<TikTokTokenResponse> {
  const redirectUri = `${APP_URL}/api/tiktok/callback`;

  const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      client_secret: TIKTOK_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TikTok token exchange failed: ${err}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`TikTok error: ${data.error_description || data.error}`);
  }
  return data;
}

export async function refreshTikTokToken(refreshToken: string): Promise<TikTokTokenResponse> {
  const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      client_secret: TIKTOK_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TikTok token refresh failed: ${err}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`TikTok refresh error: ${data.error_description || data.error}`);
  }
  return data;
}

export async function getTikTokProfile(accessToken: string): Promise<{
  open_id: string;
  display_name: string;
  username: string;
  avatar_url: string;
  follower_count: number;
}> {
  const fields = 'open_id,display_name,username,avatar_url,follower_count';
  const res = await fetch(`https://open.tiktokapis.com/v2/user/info/?fields=${fields}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TikTok profile fetch failed: ${err}`);
  }

  const data = await res.json();
  if (data.error?.code !== 'ok' && data.error?.code) {
    throw new Error(`TikTok error: ${data.error.message}`);
  }

  const user = data.data?.user || {};
  return {
    open_id: user.open_id || '',
    display_name: user.display_name || user.username || '',
    username: user.username || '',
    avatar_url: user.avatar_url || '',
    follower_count: user.follower_count || 0,
  };
}

export interface TikTokVideo {
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

export async function fetchTikTokVideos(accessToken: string): Promise<TikTokVideo[]> {
  const fields = 'id,title,video_description,share_url,cover_image_url,create_time,like_count,comment_count,share_count,view_count,duration';

  const res = await fetch(`https://open.tiktokapis.com/v2/video/list/?fields=${fields}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ max_count: 20 }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TikTok video fetch failed: ${err}`);
  }

  const data = await res.json();
  if (data.error?.code !== 'ok' && data.error?.code) {
    throw new Error(`TikTok error: ${data.error.message}`);
  }

  const videos = data.data?.videos || [];
  return videos.map((v: Record<string, unknown>) => ({
    external_id: `tiktok_${v.id}`,
    titulo: ((v.title as string) || (v.video_description as string) || '').slice(0, 200) || 'TikTok Video',
    url: (v.share_url as string) || '',
    thumbnail_url: (v.cover_image_url as string) || '',
    categoria: 'viral',
    visualizacoes: (v.view_count as number) || 0,
    curtidas: (v.like_count as number) || 0,
    comentarios: (v.comment_count as number) || 0,
    compartilhamentos: (v.share_count as number) || 0,
    data_postagem: new Date(((v.create_time as number) || 0) * 1000).toISOString().split('T')[0],
  }));
}
