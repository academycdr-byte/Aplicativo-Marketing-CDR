'use client'

import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  variant?: 'ghost' | 'elevated' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  label: string
}

const variantStyles: Record<string, string> = {
  ghost: 'text-text-tertiary hover:text-text-primary hover:bg-bg-hover active:bg-bg-active',
  elevated: 'bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-bg-hover shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]',
  destructive: 'text-error hover:bg-error-surface',
}

const sizeStyles: Record<string, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

const iconSizes: Record<string, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon: Icon, variant = 'ghost', size = 'md', label, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        className={cn(
          'inline-flex items-center justify-center rounded-[var(--radius-lg)] transition-all duration-200 ease-[var(--ease-spring)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
          'disabled:opacity-50 disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        <Icon className={iconSizes[size]} />
      </button>
    )
  }
)
IconButton.displayName = 'IconButton'

export { IconButton }
