import type { MetadataRoute } from 'next';
import { absoluteUrl, isIndexingEnabled } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return isIndexingEnabled
    ? { rules: { userAgent: '*', allow: '/' }, sitemap: absoluteUrl('/sitemap.xml') }
    : { rules: { userAgent: '*', disallow: '/' } };
}
