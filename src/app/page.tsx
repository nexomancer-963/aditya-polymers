import type { Metadata } from 'next';
import { RouteView } from '@/components/route-view';
import { pageFor, publicPath } from '@/content/routes';
import { absoluteUrl } from '@/lib/site';

const content = pageFor('/');
export const metadata: Metadata = {
  title: { absolute: content.title },
  description: content.description,
  alternates: { canonical: absoluteUrl(publicPath('/')) },
  openGraph: { title: content.title, description: content.description, url: absoluteUrl(publicPath('/')), images: [{ url: '/og/home.png', width: 1200, height: 630 }] }
};
export default function HomePage() { return <RouteView route="/" />; }
