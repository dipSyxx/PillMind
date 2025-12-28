'use client'

import { FAQ, Features, Hero, HowItWorks, Pricing, Security, Trust } from '@/components/sections'
import { BrandBookBtn, CTA, Footer, Header, LoadingSpinner } from '@/components/shared'
import { Book, QrCode } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function PillMindLanding() {
  const { status } = useSession()
  const router = useRouter()

  // Redirect authenticated users to /home
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/home')
    }
  }, [status, router])

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-pm-slate-100 text-pm-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Don't render landing page if user is authenticated (will redirect)
  if (status === 'authenticated') {
    return null
  }

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
