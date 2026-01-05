import EnsureSettings from '@/components/providers/ensure-settings'
import { AuthProvider } from '@/components/providers/session-provider'
import { OrganizationStructuredData, WebSiteStructuredData } from '@/components/seo/structured-data'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { authOptions } from '@/lib/auth'
import { defaultMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { Inter, JetBrains_Mono } from 'next/font/google'
import type React from 'react'
import './globals.css'

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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className="overflow-x-hidden font-sans">
        <OrganizationStructuredData />
        <WebSiteStructuredData />
        <AuthProvider session={session}>
          <EnsureSettings />
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
