import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-[12px] text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Default variants
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-[0_4px_12px_rgba(18,181,201,0.3)]',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-105 active:scale-95',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:scale-105 active:scale-95',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105 active:scale-95',
        ghost: 'hover:bg-accent hover:text-accent-foreground hover:scale-105 active:scale-95',
        link: 'text-primary underline-offset-4 hover:underline hover:scale-105 active:scale-95',

        // PillMind-specific variants
        pillmind:
          'bg-pm-teal-600 text-white hover:bg-pm-teal-700 hover:scale-105 active:scale-95 shadow-[0_4px_12px_rgba(18,181,201,0.3)]',
        pillmindOutline:
          'border border-pm-teal-600 text-pm-teal-600 hover:bg-pm-teal-600/10 hover:scale-105 active:scale-95',
        pillmindGhost: 'text-pm-teal-600 hover:bg-pm-teal-500/10 hover:scale-105 active:scale-95',
        pillmindWhite: 'bg-white text-pm-slate-900 hover:bg-white/90 hover:scale-105 active:scale-95',
        pillmindWhiteOutline: 'border border-white/70 text-white hover:bg-white/10 hover:scale-105 active:scale-95',

        // Special purpose variants
        clear: 'text-pm-slate-500 hover:bg-pm-slate-100 hover:scale-105 active:scale-95 rounded-md px-1',
        searchResult:
          'w-full cursor-pointer px-3 py-2 text-left transition hover:bg-pm-slate-50 hover:scale-105 active:scale-95',
        searchResultActive:
          'w-full cursor-pointer px-3 py-2 text-left transition bg-pm-slate-100 hover:scale-105 active:scale-95',
        copy: 'inline-flex items-center gap-1 rounded-md border border-pm-teal-600 px-3 py-1 text-sm text-pm-teal-600 hover:bg-pm-teal-600/10 hover:scale-105 active:scale-95',
        brandbook:
          'fixed flex items-center justify-center rounded-[10px] bg-gradient-to-br from-pm-teal-500 via-pm-mint-500 to-pm-sky-500 border border-white w-14 h-14 transition-all duration-300 hover:scale-105',
      },
      size: {
        default: 'h-12 px-6 py-3',
        sm: 'h-9 rounded-[10px] px-3',
        md: 'h-11 px-5',
        lg: 'h-14 rounded-[14px] px-8 text-base',
        xl: 'h-16 rounded-[16px] px-10 text-lg',
        icon: 'h-10 w-10',
        clear: 'h-auto px-1',
        searchResult: 'h-auto px-3 py-2',
        copy: 'h-auto px-3 py-1',
        brandbook: 'w-14 h-14',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
