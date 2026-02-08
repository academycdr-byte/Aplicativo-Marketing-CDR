'use client';

import { Menu, TrendingUp } from 'lucide-react';
import { useSidebar } from './SidebarProvider';

export default function MobileHeader() {
    const { isMobile, openSidebar } = useSidebar();

    if (!isMobile) return null;

    return (
        <header className="fixed top-0 left-0 right-0 z-[80] flex items-center justify-between px-4 h-14 bg-bg-primary border-b border-border-default">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[var(--radius-lg)] flex items-center justify-center bg-accent">
                    <TrendingUp className="w-4 h-4 text-text-inverted" />
                </div>
                <span className="font-bold text-sm text-text-primary">CDR Marketing</span>
            </div>
            <button
                onClick={openSidebar}
                className="p-2 rounded-[var(--radius-lg)] text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                aria-label="Abrir menu"
            >
                <Menu className="w-5 h-5" />
            </button>
        </header>
    );
}
