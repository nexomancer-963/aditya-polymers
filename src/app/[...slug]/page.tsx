import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RouteView } from '@/components/route-view';
import { pageFor, routeFromSegments, publicRoutes, publicPath } from '@/content/routes';
import { absoluteUrl } from '@/lib/site';

type Props = { params: Promise<{ slug: string[] }> };
export function generateStaticParams() {
  return publicRoutes.map(route => ({ slug: route.slice(1).split('/') }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const route = routeFromSegments((await params).slug);
  if (!route) return {};
  const content = pageFor(route);
  return {
    title: { absolute: content.title }, description: content.description,
    alternates: { canonical: absoluteUrl(publicPath(route)) },
    openGraph: { title: content.title, description: content.description, url: absoluteUrl(publicPath(route)), images: [{ url: `/og/${route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')}.png`, width: 1200, height: 630 }] }
  };
}
export default async function ContentPage({ params }: Props) {
  const route = routeFromSegments((await params).slug);
  if (!route) notFound();
  return <RouteView route={route} />;
}
