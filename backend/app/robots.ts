import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/', '/api/', '/auth/'],
    },
    sitemap: 'https://lastbag.app/sitemap.xml',
    host: 'https://lastbag.app',
  };
}
