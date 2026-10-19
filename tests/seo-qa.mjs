import { readFile } from 'node:fs/promises';

const localOrigin = process.env.QA_ORIGIN || 'http://localhost:3187';
const siteOrigin = process.env.QA_EXPECT_SITE_ORIGIN || 'http://localhost:3000';
const indexable = process.env.QA_EXPECT_INDEXING === 'true';
const paths = JSON.parse(await readFile(new URL('../src/content/site-paths.json', import.meta.url), 'utf8'));
const results = [];
for (const [logical, publicPath] of Object.entries(paths)) {
  const response = await fetch(localOrigin + publicPath);
  const html = await response.text();
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/i)?.[1];
  const robots = html.match(/<meta name="robots" content="([^"]+)"/i)?.[1];
  results.push({ logical, publicPath, status: response.status, canonical, ogUrl, robots,
    valid: response.status === 200 && ogUrl && new URL(ogUrl).href === new URL(siteOrigin + publicPath).href
      && (indexable
        ? canonical && new URL(canonical).href === new URL(siteOrigin + publicPath).href && robots?.includes('index') && !robots?.includes('noindex')
        : !canonical && robots?.includes('noindex')) });
}
for (const [oldPath, expected] of [
  ['/index.html', paths['/']],
  ['/products', paths['/products']], ['/about', paths['/about']],
  ['/locations', '/contact.html#locations'], ['/locations-we-serve.html', '/contact.html#locations'],
  ['/capabilities', '/about-aditya-polymers.html#working-methods'], ['/contact', paths['/contact']],
  ['/enquiry.php', paths['/contact']]
]) {
  const response = await fetch(localOrigin + oldPath, { redirect: 'manual' });
  results.push({ redirect: oldPath, status: response.status, location: response.headers.get('location'),
    valid: response.status === 308 && response.headers.get('location')?.endsWith(expected) });
}
const robotsResponse = await fetch(localOrigin + '/robots.txt');
const robotsText = await robotsResponse.text();
const sitemapResponse = await fetch(localOrigin + '/sitemap.xml');
const sitemapText = await sitemapResponse.text();
const sitemapUrls = [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const expectedUrls = [...new Set(Object.values(paths))].map(path => siteOrigin + path);
results.push({ check: indexable ? 'production crawl gate' : 'review crawl gate', sitemapUrls,
  valid: indexable
    ? robotsText.includes('Allow: /') && robotsText.includes(`${siteOrigin}/sitemap.xml`)
      && sitemapUrls.length === expectedUrls.length && expectedUrls.every(url => sitemapUrls.includes(url))
    : robotsText.includes('Disallow: /') && sitemapUrls.length === 0 });
const homeHtml = await (await fetch(localOrigin + '/')).text();
const organizationJson = homeHtml.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
results.push({ check: 'Organization structured data gate', valid: indexable
  ? Boolean(organizationJson && JSON.parse(organizationJson)['@type'] === 'Organization')
  : !organizationJson });
console.log(JSON.stringify(results, null, 2));
if (results.some(result => !result.valid)) process.exitCode = 1;
