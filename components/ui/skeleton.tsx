import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-pm-surface-elevated animate-pulse rounded-[8px]', className)}
      {...props}
    />
  )
}

export { Skeleton }
