import { cn } from '@/lib/utils'
import Link from 'next/link'
import type React from 'react'

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
    <Link
      href={link}
      title="Brandbook"
      className={cn(
        'fixed flex items-center justify-center rounded-[10px] bg-gradient-to-br from-[#12B5C9] via-[#2ED3B7] to-[#3EC7E6] border border-white w-14 h-14 transition-all duration-300 hover:scale-105',
        classNamePosition,
      )}
    >
      {children}
    </Link>
  )
}
