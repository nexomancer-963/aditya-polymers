const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const vercelHost = process.env.VERCEL_URL?.trim();
export const siteOrigin = configured
  ? new URL(configured).origin
  : vercelHost ? `https://${vercelHost}` : 'http://localhost:3000';
export const isIndexingEnabled = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true'
  && process.env.NODE_ENV === 'production'
  && process.env.VERCEL_ENV !== 'preview'
  && Boolean(configured)
  && siteOrigin.startsWith('https://');

export function absoluteUrl(path: string) {
  return `${siteOrigin}${path}`;
}
