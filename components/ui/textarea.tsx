import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-pm-border placeholder:text-pm-text-muted focus-visible:border-pm-teal-600 focus-visible:ring-pm-teal-600/50 aria-invalid:ring-pm-danger/20 dark:aria-invalid:ring-pm-danger/40 aria-invalid:border-pm-danger dark:bg-pm-surface-elevated flex field-sizing-content min-h-16 w-full rounded-[12px] border bg-transparent px-3 py-2 text-base shadow-xs transition-all duration-200 outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
