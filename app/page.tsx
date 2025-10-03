'use client'

import type React from 'react'
import { Header, Footer, CTA, BrandBookBtn } from '@/components/shared'
import { Hero, Trust, HowItWorks, Features, Security, Pricing, FAQ } from '@/components/sections'
import { Book, QrCode } from 'lucide-react'

export default function PillMindLanding() {
  return (
    <main className="relative min-h-screen bg-pm-slate-100 text-pm-slate-900">
      <Header />
      <Hero />
      <Trust />
      <HowItWorks />
      <Features />
      <Security />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />

      <BrandBookBtn link="/marketing-materials" classNamePosition="right-10 bottom-[105px]">
        <QrCode color="white" className="w-7 h-7" />
      </BrandBookBtn>

      <BrandBookBtn link="/brandbook">
        <Book color="white" className="w-7 h-7" />
      </BrandBookBtn>
    </main>
  )
}
