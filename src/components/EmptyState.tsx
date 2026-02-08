import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'var(--accent-surface)' }}
      >
        <Icon className="w-7 h-7" style={{ color: 'var(--accent)' }} />
      </div>
      <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p className="text-sm text-center max-w-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>
      {action && (
        <button onClick={action.onClick} className="btn-accent">
          {action.label}
        </button>
      )}
    </div>
  );
}
