'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

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
    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm animate-backdrop" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-[201] -translate-x-1/2 -translate-y-1/2 w-full max-w-md animate-scale-in rounded-2xl p-6 bg-bg-elevated border border-border-default">
                    <div className="flex items-start gap-4">
                        {variant === 'danger' && (
                            <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-error-surface">
                                <AlertTriangle className="w-5 h-5 text-error" />
                            </div>
                        )}
                        <div className="flex-1">
                            <Dialog.Title className="text-lg font-semibold text-text-primary">{title}</Dialog.Title>
                            <Dialog.Description className="text-sm mt-1 text-text-secondary">{message}</Dialog.Description>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="ghost" size="sm" onClick={onClose}>{cancelLabel}</Button>
                        <Button
                            variant={variant === 'danger' ? 'destructive' : 'accent'}
                            size="sm"
                            onClick={() => { onConfirm(); onClose(); }}
                        >
                            {confirmLabel}
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
