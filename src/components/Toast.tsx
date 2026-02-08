'use client';

import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
    id: number;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    onClose: () => void;
}

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

const styles = {
    success: { border: 'var(--success)', bg: 'var(--success-surface)', color: 'var(--success)' },
    error: { border: 'var(--error)', bg: 'var(--error-surface)', color: 'var(--error)' },
    warning: { border: 'var(--warning)', bg: 'var(--warning-surface)', color: 'var(--warning)' },
    info: { border: 'var(--info)', bg: 'var(--info-surface)', color: 'var(--info)' },
};

export default function Toast({ type, message, onClose }: ToastProps) {
    const Icon = icons[type];
    const style = styles[type];

    return (
        <div
            className="animate-slide-in pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg"
            style={{
                background: 'var(--bg-elevated)',
                borderColor: style.border,
                boxShadow: 'var(--shadow-lg)',
            }}
        >
            <Icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: style.color }} />
            <p className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>
                {message}
            </p>
            <button
                onClick={onClose}
                className="shrink-0 p-1 rounded-lg hover:opacity-70 transition-opacity"
                style={{ color: 'var(--text-tertiary)' }}
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
