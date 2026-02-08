'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-[var(--radius-md)] bg-bg-input px-3.5 py-2.5 text-sm text-text-primary',
          'border border-border-default transition-colors duration-200',
          'placeholder:text-text-tertiary',
          'focus-visible:outline-none focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent-surface',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-error focus-visible:border-error focus-visible:ring-error-surface',
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
