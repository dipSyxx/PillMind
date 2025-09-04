'use client'

import type React from 'react'
import { Header, Footer, CTA } from '@/components/shared'
import { Hero, Trust, HowItWorks, Features, Security, Pricing, FAQ } from '@/components/sections'
import { Button } from '@/components/ui/button'

export default function PillMindLanding() {
  return (
    <main className="min-h-screen bg-[#F1F5F9] text-[#0F172A]">
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
    </main>
  )
}
