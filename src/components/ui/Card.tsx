import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive'
  hover?: boolean
}

const variantStyles: Record<string, string> = {
  default: 'bg-bg-card',
  elevated: 'bg-bg-elevated shadow-[var(--shadow-lg)]',
  interactive: 'bg-bg-card cursor-pointer hover:border-accent hover:shadow-[0_0_0_1px_var(--accent-surface)] active:scale-[0.99]',
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[var(--radius-xl)] border border-border-default transition-all duration-200',
          variantStyles[variant],
          hover && variant !== 'interactive' && 'hover:border-border-strong hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5',
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'

export { Card }
