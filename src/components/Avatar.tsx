import { getInitials, hashColor, cn } from '@/lib/utils';

interface AvatarProps {
    name: string;
    src?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses: Record<string, string> = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
};

export default function Avatar({ name, src, size = 'md' }: AvatarProps) {
    const bg = hashColor(name);
    const initials = getInitials(name);

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className={cn('rounded-full object-cover', sizeClasses[size])}
            />
        );
    }

    return (
        <div
            className={cn(
                'rounded-full flex items-center justify-center font-bold text-white shrink-0',
                sizeClasses[size]
            )}
            style={{ background: bg }}
        >
            {initials}
        </div>
    );
}
