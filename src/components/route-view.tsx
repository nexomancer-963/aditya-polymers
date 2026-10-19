import shell from '@/content/generated/shell.json';
import { pageFor, publicPath, type SiteRoute } from '@/content/routes';
import { absoluteUrl, isIndexingEnabled } from '@/lib/site';
import Script from 'next/script';

export function RouteView({ route }: { route: SiteRoute }) {
  const page = pageFor(route);
  let header = shell.header.replaceAll(' aria-current="page"', '');
  if (route === '/') header = header.replace(`<a href="${publicPath('/')}"`, `<a href="${publicPath('/')}" aria-current="page"`);
  else if (route.startsWith('/products')) header = header.replace('id="products-toggle"', 'id="products-toggle" aria-current="page"');
  else header = header.replace(`<a href="${publicPath(route)}"`, `<a href="${publicPath(route)}" aria-current="page"`);
  const organization = isIndexingEnabled && route === '/' ? {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Aditya Polymers',
    url: absoluteUrl(publicPath('/')),
    logo: absoluteUrl('/assets/source-logo-aditya-polymers.jpg')
  } : null;
  const noScriptNav = `<noscript><nav class="no-js-nav" aria-label="Site navigation"><a href="${publicPath('/products')}">Products</a><a href="${publicPath('/products/synthetic-adhesives')}">Synthetic adhesives</a><a href="${publicPath('/products/starch-based-gums')}">Starch based gums</a><a href="${publicPath('/products/wood-working-adhesives')}">Wood working</a><a href="${publicPath('/applications')}">Applications overview</a><a href="${publicPath('/applications')}#paper">Paper conversion</a><a href="${publicPath('/applications')}#packaging">Packaging and corrugation</a><a href="${publicPath('/applications')}#lamination">Lamination and labeling</a><a href="${publicPath('/applications')}#wood">Furniture and interiors</a><a href="${publicPath('/about')}">Company</a><a href="${publicPath('/contact')}">Contact</a></nav></noscript>`;

  return <>
    <div dangerouslySetInnerHTML={{ __html: `<a class="skip-link" href="#main">Skip to content</a>${header}${noScriptNav}${shell.mobileActions}${page.html}${shell.footer}${shell.dialog}` }} />
    {organization && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, '\\u003c') }} />}
    <Script src="/assets/site.js" strategy="afterInteractive" />
  </>;
}
