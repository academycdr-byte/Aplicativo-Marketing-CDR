'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'accent' | 'ghost' | 'outline' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  asChild?: boolean
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
}

const variantStyles: Record<string, string> = {
  accent: 'bg-accent text-text-inverted hover:bg-accent-hover active:scale-[0.98] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]',
  ghost: 'bg-transparent text-text-secondary hover:bg-bg-hover hover:text-text-primary border border-border-default hover:border-border-strong',
  outline: 'bg-transparent text-text-primary border border-border-strong hover:bg-bg-hover',
  destructive: 'bg-error text-white hover:opacity-90 shadow-[var(--shadow-sm)]',
}

const sizeStyles: Record<string, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-10 w-10',
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'ghost', size = 'md', asChild = false, icon: Icon, iconPosition = 'left', children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-[var(--radius-lg)] transition-all duration-200 ease-[var(--ease-spring)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
          'disabled:opacity-50 disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
        {children}
        {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button }
