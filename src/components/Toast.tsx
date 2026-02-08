'use client';

import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const variantClasses: Record<string, string> = {
    success: 'border-success',
    error: 'border-error',
    warning: 'border-warning',
    info: 'border-info',
};

const iconClasses: Record<string, string> = {
    success: 'text-success',
    error: 'text-error',
    warning: 'text-warning',
    info: 'text-info',
};

export default function Toast({ type, message, onClose }: ToastProps) {
    const Icon = icons[type];

    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={cn(
                'animate-slide-in pointer-events-auto flex items-start gap-3 p-4 rounded-[var(--radius-xl)] border shadow-[var(--shadow-lg)] bg-bg-elevated',
                variantClasses[type]
            )}
        >
            <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', iconClasses[type])} />
            <p className="text-sm font-medium flex-1 text-text-primary">
                {message}
            </p>
            <button
                onClick={onClose}
                className="shrink-0 p-1 rounded-[var(--radius-lg)] text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors"
                aria-label="Fechar notificação"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
