import type React from 'react'

interface StructuredDataProps {
  type: 'Organization' | 'WebApplication' | 'WebSite' | 'SoftwareApplication'
  data: Record<string, any>
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://v0-pill-mind-landing-page.vercel.app'

  const getStructuredData = () => {
    switch (type) {
      case 'Organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'PillMind',
          url: baseUrl,
          logo: `${baseUrl}/images/pillmind-logo.png`,
          description:
            'PillMind reminds you about your intake, analyzes your data, and suggests safe combinations. With your permission — and only for you.',
          sameAs: [
            // Add social media links when available
            // 'https://twitter.com/pillmind',
            // 'https://facebook.com/pillmind',
            // 'https://instagram.com/pillmind',
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Service',
            email: 'support@pillmind.app',
          },
          ...data,
        }

      case 'WebApplication':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'PillMind',
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Web, iOS, Android',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '150',
          },
          ...data,
        }

      case 'WebSite':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'PillMind',
          url: baseUrl,
          description:
            'PillMind reminds you about your intake, analyzes your data, and suggests safe combinations.',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${baseUrl}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
          ...data,
        }

      case 'SoftwareApplication':
        return {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'PillMind',
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Web, iOS, Android',
          description:
            'PillMind reminds you about your intake, analyzes your data, and suggests safe combinations.',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          featureList: [
            'Medication reminders',
            'Drug interaction checker',
            'Adherence tracking',
            'Health reports',
            'Privacy-first design',
          ],
          ...data,
        }

      default:
        return data
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(getStructuredData()) }}
    />
  )
}

// Pre-configured components for common use cases
export function OrganizationStructuredData() {
  return <StructuredData type="Organization" data={{}} />
}

export function WebApplicationStructuredData() {
  return <StructuredData type="WebApplication" data={{}} />
}

export function WebSiteStructuredData() {
  return <StructuredData type="WebSite" data={{}} />
}

