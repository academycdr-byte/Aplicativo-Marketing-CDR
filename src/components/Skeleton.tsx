import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
}

export function Skeleton({ className, width, height }: SkeletonProps) {
    return (
        <div
            className={cn('skeleton rounded-[var(--radius-md)]', className)}
            style={{ width, height }}
            aria-busy="true"
        />
    );
}

export function SkeletonCard() {
    return (
        <div className="bg-bg-card border border-border-default rounded-[var(--radius-xl)] p-6 space-y-4">
            <div className="flex items-center gap-3">
                <Skeleton className="rounded-full" width={40} height={40} />
                <div className="flex-1 space-y-2">
                    <Skeleton height={14} width="60%" />
                    <Skeleton height={12} width="40%" />
                </div>
            </div>
            <Skeleton height={12} width="100%" />
            <Skeleton height={12} width="80%" />
        </div>
    );
}

export function SkeletonStats() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-bg-card border border-border-default rounded-[var(--radius-xl)] p-6 space-y-3">
                    <Skeleton height={12} width="50%" />
                    <Skeleton height={28} width="70%" />
                    <Skeleton height={10} width="40%" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonChart() {
    return (
        <div className="bg-bg-card border border-border-default rounded-[var(--radius-xl)] p-6">
            <Skeleton height={14} width="30%" />
            <div className="mt-4">
                <Skeleton className="rounded-[var(--radius-lg)]" height={250} width="100%" />
            </div>
        </div>
    );
}

export function SkeletonTable() {
    return (
        <div className="bg-bg-card border border-border-default rounded-[var(--radius-xl)] p-6 space-y-3">
            <Skeleton height={14} width="30%" />
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4 py-2">
                    <Skeleton className="rounded-full" width={32} height={32} />
                    <Skeleton height={14} width="40%" />
                    <div className="flex-1" />
                    <Skeleton height={14} width="20%" />
                </div>
            ))}
        </div>
    );
}
