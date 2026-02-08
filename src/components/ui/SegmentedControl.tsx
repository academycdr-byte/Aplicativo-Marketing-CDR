'use client'

import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SegmentOption<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: SegmentedControlProps<T>) {
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  }

  return (
    <div className="inline-flex items-center gap-1 p-1 bg-bg-secondary rounded-[var(--radius-lg)] border border-border-default">
      {options.map((option) => {
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 font-medium rounded-[var(--radius-md)] transition-all duration-200',
              sizeClasses[size],
              isActive
                ? 'bg-bg-card text-text-primary shadow-[var(--shadow-sm)]'
                : 'text-text-tertiary hover:text-text-secondary'
            )}
          >
            {option.icon && <option.icon className="w-4 h-4" />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
