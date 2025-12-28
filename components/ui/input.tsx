import { cn } from '@/lib/utils'
import * as React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, leftIcon, rightIcon, ...props }, ref) => {
    const inputId = React.useId()
    const errorId = React.useId()
    const helperId = React.useId()

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[#334155]">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">{leftIcon}</div>}
          <input
            id={inputId}
            type={type}
            className={cn(
              'flex h-12 w-full rounded-[12px] border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-all duration-200 focus:border-[#0EA8BC] focus:ring-4 focus:ring-[#12B5C9]/20 disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              className,
            )}
            ref={ref}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            {...props}
          />
          {rightIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]">{rightIcon}</div>}
        </div>
        {error && (
          <p id={errorId} className="text-sm text-red-500">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="text-sm text-[#64748B]">
            {helperText}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

export { Input }
