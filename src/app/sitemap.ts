import type { MetadataRoute } from 'next';
import { publicRoutes } from '@/content/routes';
import { absoluteUrl, isIndexingEnabled } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isIndexingEnabled) return [];
  return publicRoutes.map(route => ({ url: absoluteUrl(route) }));
}
