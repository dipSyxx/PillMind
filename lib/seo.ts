import type { Metadata } from 'next'

export const defaultMetadata: Metadata = {
  title: {
    default: 'PillMind - Taking medicine has become easier',
    template: '%s | PillMind'
  },
  description: 'PillMind reminds you about your intake, analyzes your data, and suggests safe combinations. With your permission — and only for you.',
  keywords: ['medicine', 'reminders', 'health', 'medication', 'app', 'pill reminder', 'healthcare'],
  authors: [{ name: 'PillMind Team' }],
  creator: 'PillMind',
  publisher: 'PillMind',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://pillmind.app'),
  alternates: {
    canonical: '/',
    languages: {
      'uk': '/uk',
      'en': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    url: 'https://pillmind.app',
    title: 'PillMind - Taking medicine has become easier',
    description: 'PillMind reminds you about your intake, analyzes your data, and suggests safe combinations.',
    siteName: 'PillMind',
    images: [
      {
        url: '/images/pillmind-logo.png',
        width: 1200,
        height: 630,
        alt: 'PillMind - Medication Reminder App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PillMind - Taking medicine has become easier',
    description: 'PillMind reminds you about your intake, analyzes your data, and suggests safe combinations.',
    images: ['/images/pillmind-logo.png'],
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
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
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
