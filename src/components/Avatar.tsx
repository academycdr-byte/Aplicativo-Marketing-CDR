import { getInitials, hashColor } from '@/lib/utils';

interface AvatarProps {
    name: string;
    src?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
    sm: { wh: 32, font: 12 },
    md: { wh: 40, font: 14 },
    lg: { wh: 48, font: 16 },
    xl: { wh: 64, font: 20 },
};

export default function Avatar({ name, src, size = 'md' }: AvatarProps) {
    const s = sizes[size];
    const bg = hashColor(name);
    const initials = getInitials(name);

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className="rounded-full object-cover"
                style={{ width: s.wh, height: s.wh }}
            />
        );
    }

    return (
        <div
            className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
            style={{ width: s.wh, height: s.wh, background: bg, fontSize: s.font }}
        >
            {initials}
        </div>
    );
}
