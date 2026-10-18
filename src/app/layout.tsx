import type { Metadata } from 'next';
import { siteOrigin, isIndexingEnabled } from '@/lib/site';
import '../styles/home.css';
import '../styles/site.css';
import '../styles/nav.css';
import '../styles/material.css';
import '../styles/polish.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: { default: 'Aditya Polymers', template: '%s | Aditya Polymers' },
  applicationName: 'Aditya Polymers',
  robots: isIndexingEnabled ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: { type: 'website', siteName: 'Aditya Polymers', locale: 'en_IN' }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
