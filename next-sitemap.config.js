/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://v0-pill-mind-landing-page.vercel.app',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  generateSitemap: false, // Disable external sitemap generation since we're using Next.js built-in
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/private/', '/api/'],
      },
    ],
    additionalSitemaps: [
      'https://v0-pill-mind-landing-page.vercel.app/sitemap.xml',
    ],
  },
  exclude: ['/admin/*', '/private/*', '/api/*', '/sitemap.xml'],
  changefreq: 'monthly',
  priority: 0.7,
  sitemapSize: 5000,
  transform: async (config, path) => {
    // Custom priority for different page types
    let priority = config.priority
    
    if (path === '/') {
      priority = 1.0
    } else if (path.includes('#how') || path.includes('#features') || path.includes('#pricing')) {
      priority = 0.8
    } else if (path.includes('#faq')) {
      priority = 0.6
    }
    
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    }
  },
}
