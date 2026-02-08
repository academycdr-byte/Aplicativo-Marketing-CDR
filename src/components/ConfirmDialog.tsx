'use client';

import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'default';
}

export default function ConfirmDialog({
    isOpen, onClose, onConfirm, title, message,
    confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', variant = 'default'
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: { bg: 'var(--error)', color: '#fff' },
        warning: { bg: 'var(--warning)', color: '#fff' },
        default: { bg: 'var(--accent)', color: 'var(--text-inverted)' },
    };

    const vs = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop" onClick={onClose} />
            <div
                className="relative w-full max-w-md animate-scale-in rounded-2xl p-6"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
                <div className="flex items-start gap-4">
                    {variant === 'danger' && (
                        <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--error-surface)' }}>
                            <AlertTriangle className="w-5 h-5" style={{ color: 'var(--error)' }} />
                        </div>
                    )}
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{message}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="btn-ghost text-sm">{cancelLabel}</button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
                        style={{ background: vs.bg, color: vs.color }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
