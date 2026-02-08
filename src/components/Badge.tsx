import { cn } from '@/lib/utils';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'viral' | 'tecnico' | 'instagram' | 'tiktok' | 'accent';
    size?: 'sm' | 'md';
}

const variantClasses: Record<string, string> = {
    default: 'bg-bg-hover text-text-secondary',
    success: 'bg-success-surface text-success',
    warning: 'bg-warning-surface text-warning',
    error: 'bg-error-surface text-error',
    info: 'bg-info-surface text-info',
    viral: 'bg-viral-surface text-viral',
    tecnico: 'bg-tecnico-surface text-tecnico',
    instagram: 'bg-instagram-surface text-instagram',
    tiktok: 'bg-tiktok-surface text-tiktok',
    accent: 'bg-accent-surface text-accent',
};

const sizeClasses: Record<string, string> = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-xs',
};

export default function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
    return (
        <span className={cn(
            'inline-flex items-center gap-1 rounded-[var(--radius-sm)] font-semibold leading-snug',
            variantClasses[variant],
            sizeClasses[size],
        )}>
            {children}
        </span>
    );
}
