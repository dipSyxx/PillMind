import type React from 'react'
import type { Metadata } from 'next'
import { generateMetadata as genMeta } from '@/lib/seo'

export const metadata: Metadata = genMeta({
  title: 'Marketing Materials - PillMind',
  description:
    'One place for PillMind campaign assets, copy, formats, analytics rules and templates — aligned with our brandbook.',
  image: '/images/pillmind-logo.png',
})

export default function MarketingMaterialsLayout({ children }: { children: React.ReactNode }) {
  return children
}

