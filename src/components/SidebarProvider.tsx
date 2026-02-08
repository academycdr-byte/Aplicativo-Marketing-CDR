'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface SidebarContextValue {
    isOpen: boolean;
    isCollapsed: boolean;
    openSidebar: () => void;
    closeSidebar: () => void;
    toggleSidebar: () => void;
    isMobile: boolean;
    isTablet: boolean;
}

const SidebarContext = createContext<SidebarContextValue>({
    isOpen: false,
    isCollapsed: false,
    openSidebar: () => { },
    closeSidebar: () => { },
    toggleSidebar: () => { },
    isMobile: false,
    isTablet: false,
});

export function useSidebar() {
    return useContext(SidebarContext);
}

export default function SidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const check = () => {
            const w = window.innerWidth;
            setIsMobile(w < 768);
            setIsTablet(w >= 768 && w < 1024);
            if (w >= 1024) setIsOpen(false);
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const openSidebar = useCallback(() => setIsOpen(true), []);
    const closeSidebar = useCallback(() => setIsOpen(false), []);
    const toggleSidebar = useCallback(() => setIsOpen(prev => !prev), []);

    const isCollapsed = isTablet && !isOpen;

    return (
        <SidebarContext.Provider value={{ isOpen, isCollapsed, openSidebar, closeSidebar, toggleSidebar, isMobile, isTablet }}>
            {children}
        </SidebarContext.Provider>
    );
}
