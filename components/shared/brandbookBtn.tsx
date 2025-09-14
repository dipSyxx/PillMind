import { cn } from '@/lib/utils'
import Link from 'next/link'
import type React from 'react'
import { Button } from '@/components/ui/button'

export function BrandBookBtn({
  link,
  children,
  classNamePosition = 'bottom-10 right-10',
}: {
  link: string
  children: React.ReactNode
  classNamePosition?: string
}) {
  return (
    <Button asChild variant="brandbook" size="brandbook" className={cn('fixed', classNamePosition)}>
      <Link href={link} title="Brandbook">
        {children}
      </Link>
    </Button>
  )
}
