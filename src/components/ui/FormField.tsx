import * as React from 'react'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  children: React.ReactNode
}

export function FormField({ label, htmlFor, required, error, hint, className, children }: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary"
      >
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-text-tertiary">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-error font-medium">{error}</p>
      )}
    </div>
  )
}
