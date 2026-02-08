'use client';

import { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-sm mt-1 text-text-secondary">
                        {subtitle}
                    </p>
                )}
            </div>
            {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
        </div>
    );
}
