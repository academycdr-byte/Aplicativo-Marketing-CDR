import { NextRequest, NextResponse } from 'next/server';
import { getTikTokAuthUrl } from '@/lib/tiktok';

export async function GET(request: NextRequest) {
    // Generate a random state for security
    const state = Math.random().toString(36).substring(7);

    // Get the authorization URL
    const authUrl = getTikTokAuthUrl(state);

    // Redirect the user to TikTok
    return NextResponse.redirect(authUrl);
}
