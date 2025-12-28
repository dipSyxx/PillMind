import type React from 'react'
import type { Metadata } from 'next'
import { generateMetadata as genMeta } from '@/lib/seo'

export const metadata: Metadata = genMeta({
  title: 'Brandbook - PillMind',
  description:
    'Visual and verbal rules so PillMind looks and sounds consistent across product, web and communications.',
  image: '/images/pillmind-logo.png',
})

export default function BrandbookLayout({ children }: { children: React.ReactNode }) {
  return children
}

