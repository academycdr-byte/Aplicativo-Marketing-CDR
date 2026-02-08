'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-[var(--radius-md)] bg-bg-input px-3 py-2 text-sm text-text-primary',
          'border border-border-default transition-colors duration-200',
          'focus-visible:outline-none focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent-surface',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-error focus-visible:border-error focus-visible:ring-error-surface',
          className
        )}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = 'Select'

export { Select }
