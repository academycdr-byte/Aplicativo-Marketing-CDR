'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarProvider';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Share2, FileVideo, DollarSign, Settings,
  TrendingUp, Sun, Moon, X, Store,
} from 'lucide-react';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/colaboradores', label: 'Colaboradores', icon: Users },
  { href: '/contas', label: 'Contas Sociais', icon: Share2 },
  { href: '/lojas', label: 'Lojas Shopify', icon: Store },
  { href: '/postagens', label: 'Postagens', icon: FileVideo },
  { href: '/comissoes', label: 'Comissões', icon: DollarSign },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, closeSidebar, isMobile, isCollapsed } = useSidebar();
  const { resolvedTheme, toggleTheme } = useTheme();

  const collapsed = isCollapsed && !isOpen;
  const sidebarWidth = collapsed ? 72 : 280;

  if (isMobile && !isOpen) return null;

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm animate-backdrop"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-[95] flex flex-col bg-sidebar-bg border-r border-sidebar-border',
          isMobile ? 'animate-drawer' : 'transition-all duration-200'
        )}
        style={{ width: isMobile ? 280 : sidebarWidth }}
      >
        {/* Logo */}
        <div className="p-5 flex items-center justify-between border-b border-sidebar-border">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/logo.png"
              alt="CDR Logo"
              className="w-14 h-14 rounded-[var(--radius-xl)] object-contain shrink-0"
            />
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-base font-bold text-white truncate">CDR Marketing</h1>
                <p className="text-xs text-text-tertiary truncate">Gestão de Comissões</p>
              </div>
            )}
          </div>
          {isMobile && (
            <button
              onClick={closeSidebar}
              className="p-2 text-text-tertiary hover:text-white rounded-[var(--radius-lg)] transition-colors"
              aria-label="Fechar menu"
            >
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
                className={cn(
                  'flex items-center gap-3 relative rounded-[var(--radius-xl)] text-sm font-medium transition-all duration-200',
                  collapsed ? 'justify-center p-3' : 'px-4 py-2.5',
                  isActive
                    ? 'text-white bg-[rgba(184,255,0,0.08)]'
                    : 'text-text-tertiary hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                )}
                data-tooltip={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" />
                )}
                <Icon className={cn('w-5 h-5 shrink-0', isActive && 'text-accent')} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 space-y-2 border-t border-sidebar-border">
          <button
            onClick={toggleTheme}
            className={cn(
              'flex items-center gap-3 w-full rounded-[var(--radius-xl)] text-sm font-medium transition-all duration-200',
              'text-text-tertiary hover:text-white hover:bg-[rgba(255,255,255,0.05)]',
              collapsed ? 'justify-center p-2.5' : 'px-4 py-2.5'
            )}
            aria-label={resolvedTheme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {resolvedTheme === 'dark' ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
            {!collapsed && <span>{resolvedTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>}
          </button>

          <div className={cn(
            'flex items-center gap-3 rounded-[var(--radius-xl)]',
            collapsed ? 'justify-center p-2.5' : 'px-4 py-2.5'
          )}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-accent text-text-inverted">
              A
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">Admin CDR</p>
                <p className="text-xs text-text-tertiary truncate">Administrador</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
