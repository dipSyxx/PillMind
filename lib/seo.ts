import type { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://v0-pill-mind-landing-page.vercel.app'

export const defaultMetadata: Metadata = {
  title: {
    default: 'PillMind - Taking medicine has become easier',
    template: '%s | PillMind',
  },
  description:
    'PillMind reminds you about your intake, analyzes your data, and suggests safe combinations. With your permission — and only for you.',
  keywords: [
    'medicine',
    'reminders',
    'health',
    'medication',
    'app',
    'pill reminder',
    'healthcare',
    'medication tracker',
    'drug interaction checker',
    'adherence tracking',
    'health app',
    'medication management',
    'pill organizer',
    'medicine reminder app',
  ],
  authors: [{ name: 'PillMind Team' }],
  creator: 'PillMind',
  publisher: 'PillMind',
  applicationName: 'PillMind',
  category: 'healthcare',
  classification: 'Health & Fitness',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: '/',
    languages: {
      uk: '/uk',
      en: '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    alternateLocale: ['en_US'],
    url: baseUrl,
    title: 'PillMind - Taking medicine has become easier',
    description: 'PillMind reminds you about your intake, analyzes your data, and suggests safe combinations.',
    siteName: 'PillMind',
    images: [
      {
        url: '/images/pillmind-logo.png',
        width: 1200,
        height: 630,
        alt: 'PillMind - Medication Reminder App',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PillMind - Taking medicine has become easier',
    description: 'PillMind reminds you about your intake, analyzes your data, and suggests safe combinations.',
    images: ['/images/pillmind-logo.png'],
    creator: '@pillmind',
    site: '@pillmind',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || 'your-google-verification-code',
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || 'your-yandex-verification-code',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PillMind',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon/icon1.png', sizes: 'any' },
      { url: '/favicon/icon0.svg', type: 'image/svg+xml' },
      { url: '/favicon/favicon.ico', sizes: '32x32' },
    ],
    apple: [
      { url: '/favicon/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon/favicon.ico',
  },
  other: {
    'apple-mobile-web-app-title': 'PillMind',
  },
}

export function generateMetadata({
  title,
  description,
  image,
  noIndex = false,
}: {
  title?: string
  description?: string
  image?: string
  noIndex?: boolean
} = {}): Metadata {
  return {
    ...defaultMetadata,
    ...(title && { title }),
    ...(description && { description }),
    ...(image && {
      openGraph: {
        ...defaultMetadata.openGraph,
        images: [{ url: image }],
      },
      twitter: {
        ...defaultMetadata.twitter,
        images: [image],
      },
    }),
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  }
}
