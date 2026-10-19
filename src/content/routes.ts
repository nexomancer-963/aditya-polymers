import pages from './generated/pages.json';
import sitePaths from './site-paths.json';

export type SiteRoute = keyof typeof pages;
export const routes = Object.keys(pages) as SiteRoute[];
const paths = sitePaths satisfies Record<SiteRoute, string>;
const byPublicPath = new Map(Object.entries(paths).map(([route, publicPath]) => [publicPath, route as SiteRoute]));

export function publicPath(route: SiteRoute) {
  return paths[route];
}

export const publicRoutes = routes.map(publicPath);

export function routeFromSegments(segments: string[]): SiteRoute | null {
  const route = `/${segments.join('/')}`;
  return byPublicPath.get(route) || null;
}

export function pageFor(route: SiteRoute) {
  return pages[route];
}
