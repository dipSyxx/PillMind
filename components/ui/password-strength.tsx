import React from 'react'
import { calculatePasswordStrength } from '@/lib/validation'
import { cn } from '@/lib/utils'

interface PasswordStrengthProps {
  password: string
  className?: string
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const strength = calculatePasswordStrength(password)

  if (!password) return null

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#64748B]">Password strength</span>
        <span className={cn('text-sm font-medium', strength.color)}>{strength.label}</span>
      </div>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              'h-2 flex-1 rounded-full transition-colors duration-200',
              level <= strength.score
                ? strength.score <= 2
                  ? 'bg-red-500'
                  : strength.score <= 3
                    ? 'bg-orange-500'
                    : strength.score <= 4
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                : 'bg-[#E2E8F0]',
            )}
          />
        ))}
      </div>
    </div>
  )
}
