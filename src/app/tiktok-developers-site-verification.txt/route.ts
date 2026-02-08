import { NextResponse } from 'next/server';

export async function GET() {
    return new NextResponse('tiktok-developers-site-verification=aNlteyUYSLiUyI1Z0xn6qtzm6cgx872B', {
        headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-store, max-age=0',
        },
    });
}
