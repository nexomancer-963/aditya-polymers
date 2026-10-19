import type { Metadata } from 'next';
import { siteOrigin, isIndexingEnabled } from '@/lib/site';
import '../styles/home.css';
import '../styles/site.css';
import '../styles/nav.css';
import '../styles/material.css';
import '../styles/polish.css';
import '../styles/page-transitions.css';
import '../styles/typography.css';
import '../styles/phase7-products.css';
import '../styles/phase7-trust-contact.css';
import '../styles/phase7-modal.css';
import '../styles/phase7-layout-audit.css';
import '../styles/scrollbars.css';
import '../styles/phase8-art.css';
import '../styles/parallax.css';
import '../styles/family-progress.css';
import '../styles/mobile-rails.css';

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
