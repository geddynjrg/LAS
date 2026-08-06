import { LOANS_SITE_URL } from '@/lib/seo/site';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/apply/',
        '/admin/',
        '/login',
        '/signup',
        '/reset',
        '/confirm/',
        '/api/',
      ],
    },
    sitemap: `${LOANS_SITE_URL}/sitemap.xml`,
    host: LOANS_SITE_URL,
  };
}
