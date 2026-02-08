'use client';

import { ReactNode } from 'react';
import ThemeProvider from './ThemeProvider';
import SidebarProvider, { useSidebar } from './SidebarProvider';
import ToastProvider from './ToastProvider';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';

function LayoutInner({ children }: { children: ReactNode }) {
    const { isMobile, isTablet, isCollapsed } = useSidebar();

    const marginLeft = isMobile ? 0 : isCollapsed ? 72 : 280;
    const paddingTop = isMobile ? 56 : 0;

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            <Sidebar />
            <MobileHeader />
            <main
                className="transition-[margin] duration-200"
                style={{ marginLeft, paddingTop }}
            >
                <div className="p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider>
            <SidebarProvider>
                <ToastProvider>
                    <LayoutInner>{children}</LayoutInner>
                </ToastProvider>
            </SidebarProvider>
        </ThemeProvider>
    );
}
