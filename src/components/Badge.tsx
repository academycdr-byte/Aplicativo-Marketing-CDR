interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'viral' | 'tecnico' | 'instagram' | 'tiktok' | 'accent';
    size?: 'sm' | 'md';
}

const variantStyles: Record<string, { bg: string; color: string }> = {
    default: { bg: 'var(--bg-hover)', color: 'var(--text-secondary)' },
    success: { bg: 'var(--success-surface)', color: 'var(--success)' },
    warning: { bg: 'var(--warning-surface)', color: 'var(--warning)' },
    error: { bg: 'var(--error-surface)', color: 'var(--error)' },
    info: { bg: 'var(--info-surface)', color: 'var(--info)' },
    viral: { bg: 'var(--viral-surface)', color: 'var(--viral)' },
    tecnico: { bg: 'var(--tecnico-surface)', color: 'var(--tecnico)' },
    instagram: { bg: 'var(--instagram-surface)', color: 'var(--instagram)' },
    tiktok: { bg: 'var(--tiktok-surface)', color: 'var(--tiktok)' },
    accent: { bg: 'var(--accent-surface)', color: 'var(--accent)' },
};

export default function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
    const style = variantStyles[variant];
    const padding = size === 'sm' ? '2px 8px' : '4px 12px';
    const fontSize = size === 'sm' ? '11px' : '12px';

    return (
        <span
            className="badge"
            style={{
                background: style.bg,
                color: style.color,
                padding,
                fontSize,
            }}
        >
            {children}
        </span>
    );
}
