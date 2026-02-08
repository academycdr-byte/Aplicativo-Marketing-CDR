import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
}

export default function StatsCard({ title, value, subtitle, icon: Icon, trend }: StatsCardProps) {
  const trendPositive = trend && trend.value >= 0;

  return (
    <div className="bg-bg-card border border-border-default rounded-[var(--radius-xl)] p-5 md:p-6 animate-fade-in transition-all duration-200 hover:border-border-strong hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            {title}
          </p>
          <p className="text-2xl md:text-3xl font-bold mt-2 text-text-primary">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs mt-1 truncate text-text-tertiary">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1.5 mt-2">
              {trendPositive ? (
                <TrendingUp className="w-3.5 h-3.5 text-success" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-error" />
              )}
              <span className={cn('text-xs font-semibold', trendPositive ? 'text-success' : 'text-error')}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-text-tertiary">{trend.label}</span>
            </div>
          )}
        </div>
        <div className="w-11 h-11 rounded-[var(--radius-xl)] flex items-center justify-center shrink-0 bg-accent-surface">
          <Icon className="w-5 h-5 text-accent" />
        </div>
      </div>
    </div>
  );
}
