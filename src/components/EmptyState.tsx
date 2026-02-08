import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui';

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
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 bg-accent-surface">
        <Icon className="w-7 h-7 text-accent" />
      </div>
      <h3 className="text-lg font-semibold mb-1 text-text-primary">
        {title}
      </h3>
      <p className="text-sm text-center max-w-sm mb-6 text-text-secondary">
        {description}
      </p>
      {action && (
        <Button variant="accent" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
