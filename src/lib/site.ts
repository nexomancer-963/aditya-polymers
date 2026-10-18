export const approvedSiteOrigin = 'https://www.m.adityapolymers.com';
const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
export const siteOrigin = configured ? configured.replace(/\/$/, '') : approvedSiteOrigin;
export const isIndexingEnabled = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true'
  && process.env.NODE_ENV === 'production'
  && siteOrigin === approvedSiteOrigin;

export function absoluteUrl(path: string) {
  return `${siteOrigin}${path === '/' ? '' : path}`;
}
