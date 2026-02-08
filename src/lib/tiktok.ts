const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const TIKTOK_USER_INFO_URL = 'https://open.tiktokapis.com/v2/user/info/';
const TIKTOK_VIDEO_LIST_URL = 'https://open.tiktokapis.com/v2/video/list/';

export function getTikTokAuthUrl(state: string | number): string {
    const redirectUri = `${APP_URL}/api/tiktok/callback`;
    const scopes = 'user.info.basic,user.info.stats,video.list';

    const params = new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        response_type: 'code',
        scope: scopes,
        redirect_uri: redirectUri,
        state: state.toString(),
    });

    return `${TIKTOK_AUTH_URL}?${params.toString()}`;
}

export async function exchangeTikTokCode(code: string): Promise<{
    access_token: string;
    expires_in: number;
    refresh_token: string;
    refresh_expires_in: number;
    open_id: string; // user id
}> {
    const redirectUri = `${APP_URL}/api/tiktok/callback`;

    const params = new URLSearchParams();
    params.append('client_key', TIKTOK_CLIENT_KEY);
    params.append('client_secret', TIKTOK_CLIENT_SECRET);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', redirectUri);

    const response = await fetch(TIKTOK_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache',
        },
        body: params,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TikTok Token Exchange Failed: ${errorText}`);
    }

    const data = await response.json();

    if (data.error_code && data.error_code !== 0) {
        throw new Error(`TikTok Error ${data.error_code}: ${data.message}`);
    }

    return data.data; // TikTok wraps response in 'data' object
}

export async function refreshTikTokToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
    refresh_token: string;
    refresh_expires_in: number;
    open_id: string;
}> {
    const params = new URLSearchParams();
    params.append('client_key', TIKTOK_CLIENT_KEY);
    params.append('client_secret', TIKTOK_CLIENT_SECRET);
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);

    const response = await fetch(TIKTOK_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
    });

    if (!response.ok) {
        throw new Error('Failed to refresh TikTok token');
    }

    const data = await response.json();
    return data.data;
}

export async function getTikTokProfile(accessToken: string): Promise<{
    avatar_url: string;
    display_name: string;
    username: string; // Note: TikTok API doesn't always performantly give username, usually display_name
    follower_count: number;
}> {
    const fields = ['avatar_url', 'display_name', 'follower_count'];
    const url = `${TIKTOK_USER_INFO_URL}?fields=${fields.join(',')}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch TikTok profile');
    }

    const data = await response.json();
    const user = data.data.user;

    return {
        avatar_url: user.avatar_url,
        display_name: user.display_name,
        username: user.display_name, // Mapping display_name to username as fallback
        follower_count: user.follower_count || 0,
    };
}
