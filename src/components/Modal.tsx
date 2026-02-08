'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm animate-backdrop" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-[151] -translate-x-1/2 -translate-y-1/2',
            'w-[calc(100%-2rem)] max-h-[90vh] flex flex-col',
            'bg-bg-elevated border border-border-default rounded-2xl shadow-[var(--shadow-xl)]',
            'animate-scale-in',
            sizeClasses[size]
          )}
          onOpenAutoFocus={(e) => {
            const target = e.currentTarget as HTMLElement | null;
            const firstInput = target?.querySelector('input, select, textarea');
            if (firstInput instanceof HTMLElement) {
              e.preventDefault();
              firstInput.focus();
            }
          }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-default shrink-0">
            <Dialog.Title className="text-lg font-semibold text-text-primary">
              {title}
            </Dialog.Title>
            <Dialog.Close className="p-2 rounded-[var(--radius-lg)] text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>
          <div className="p-6 overflow-y-auto">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
