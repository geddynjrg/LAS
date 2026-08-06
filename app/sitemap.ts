import { LOANS_PUBLIC_PATHS, LOANS_SITE_URL } from '@/lib/seo/site';
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return LOANS_PUBLIC_PATHS.map((path) => ({
    url: new URL(path, LOANS_SITE_URL).toString(),
    lastModified,
    changeFrequency: 'weekly',
    priority: 1,
  }));
}
