import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-[8px] border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-pm-teal-600 focus-visible:ring-pm-teal-600/50 focus-visible:ring-[3px] aria-invalid:ring-pm-danger/20 dark:aria-invalid:ring-pm-danger/40 aria-invalid:border-pm-danger transition-all duration-200 overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-pm-teal-600 text-white [a&]:hover:bg-pm-teal-700',
        secondary: 'border-transparent bg-pm-slate-100 text-pm-slate-900 [a&]:hover:bg-pm-slate-200',
        destructive:
          'border-transparent bg-pm-danger text-white [a&]:hover:bg-pm-danger/90 focus-visible:ring-pm-danger/20 dark:focus-visible:ring-pm-danger/40 dark:bg-pm-danger/60',
        outline:
          'text-pm-text-primary border-pm-border [a&]:hover:bg-pm-surface-elevated [a&]:hover:text-pm-text-primary',
        success: 'border-transparent bg-pm-success text-white [a&]:hover:bg-pm-success/90',
        warning: 'border-transparent bg-pm-warning text-white [a&]:hover:bg-pm-warning/90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
