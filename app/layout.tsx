import type React from 'react'
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { defaultMetadata } from '@/lib/seo'
import { AuthProvider } from '@/components/providers/session-provider'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import EnsureSettings from '@/components/providers/ensure-settings'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = defaultMetadata

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className="overflow-x-hidden font-sans">
        <AuthProvider session={session}>
          <EnsureSettings />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
