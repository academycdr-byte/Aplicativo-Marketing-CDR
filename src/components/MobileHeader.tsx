'use client';

import { Menu, TrendingUp } from 'lucide-react';
import { useSidebar } from './SidebarProvider';

export default function MobileHeader() {
    const { isMobile, openSidebar } = useSidebar();

    if (!isMobile) return null;

    return (
        <header
            className="fixed top-0 left-0 right-0 z-[80] flex items-center justify-between px-4 h-14"
            style={{
                background: 'var(--bg-primary)',
                borderBottom: '1px solid var(--border)',
            }}
        >
            <div className="flex items-center gap-3">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--accent)' }}
                >
                    <TrendingUp className="w-4 h-4" style={{ color: 'var(--text-inverted)' }} />
                </div>
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>CDR Marketing</span>
            </div>
            <button
                onClick={openSidebar}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
            >
                <Menu className="w-5 h-5" />
            </button>
        </header>
    );
}
