import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

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
    <div className="card card-hover p-5 md:p-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            {title}
          </p>
          <p className="text-2xl md:text-3xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-tertiary)' }}>{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1.5 mt-2">
              {trendPositive ? (
                <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" style={{ color: 'var(--error)' }} />
              )}
              <span
                className="text-xs font-semibold"
                style={{ color: trendPositive ? 'var(--success)' : 'var(--error)' }}
              >
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{trend.label}</span>
            </div>
          )}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--accent-surface)' }}
        >
          <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
        </div>
      </div>
    </div>
  );
}
