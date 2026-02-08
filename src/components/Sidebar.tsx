'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarProvider';
import { useTheme } from './ThemeProvider';
import {
  LayoutDashboard, Users, Share2, FileVideo, DollarSign, Settings,
  TrendingUp, Sun, Moon, X, LogOut,
} from 'lucide-react';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/colaboradores', label: 'Colaboradores', icon: Users },
  { href: '/contas', label: 'Contas Sociais', icon: Share2 },
  { href: '/postagens', label: 'Postagens', icon: FileVideo },
  { href: '/comissoes', label: 'Comissões', icon: DollarSign },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, closeSidebar, isMobile, isTablet, isCollapsed } = useSidebar();
  const { resolvedTheme, toggleTheme } = useTheme();

  const collapsed = isCollapsed && !isOpen;
  const sidebarWidth = collapsed ? 72 : 280;

  // Mobile: only show if isOpen
  if (isMobile && !isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm animate-backdrop"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full z-[95] flex flex-col ${isMobile ? 'animate-drawer' : ''}`}
        style={{
          width: isMobile ? 280 : sidebarWidth,
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
          transition: isMobile ? 'none' : 'width 0.2s ease',
        }}
      >
        {/* Logo */}
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent)' }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--text-inverted)' }} />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-base font-bold text-white truncate">CDR Marketing</h1>
                <p className="text-xs text-gray-500 truncate">Gestão de Comissões</p>
              </div>
            )}
          </div>
          {isMobile && (
            <button onClick={closeSidebar} className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={isMobile ? closeSidebar : undefined}
                className="flex items-center gap-3 relative rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  padding: collapsed ? '12px' : '10px 16px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: isActive ? '#FFFFFF' : '#9CA3AF',
                  background: isActive ? 'rgba(184, 255, 0, 0.08)' : 'transparent',
                }}
                data-tooltip={collapsed ? item.label : undefined}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                    style={{ height: 20, background: 'var(--accent)' }}
                  />
                )}
                <Icon className="w-5 h-5 shrink-0" style={{ color: isActive ? 'var(--accent)' : undefined }} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 space-y-2" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              padding: collapsed ? '10px' : '10px 16px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: '#9CA3AF',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            {resolvedTheme === 'dark' ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
            {!collapsed && <span>{resolvedTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>}
          </button>

          {/* Admin User */}
          <div
            className="flex items-center gap-3 rounded-xl"
            style={{
              padding: collapsed ? '10px' : '10px 16px',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: 'var(--accent)', color: 'var(--text-inverted)' }}
            >
              A
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">Admin CDR</p>
                <p className="text-xs text-gray-500 truncate">Administrador</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
