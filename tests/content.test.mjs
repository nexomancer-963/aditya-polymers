import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.');
const pages = JSON.parse(await readFile(path.join(root, 'src/content/generated/pages.json'), 'utf8'));
const shell = JSON.parse(await readFile(path.join(root, 'src/content/generated/shell.json'), 'utf8'));
const sitePaths = JSON.parse(await readFile(path.join(root, 'src/content/site-paths.json'), 'utf8'));

test('all ten public pages have unique search copy and one main landmark', () => {
  assert.equal(Object.keys(pages).length, 10);
  assert.equal(new Set(Object.values(pages).map(page => page.title)).size, 10);
  assert.equal(new Set(Object.values(pages).map(page => page.description)).size, 10);
  assert.deepEqual(Object.keys(sitePaths).sort(), Object.keys(pages).sort());
  assert.equal(new Set(Object.values(sitePaths)).size, 10);
  for (const [route, page] of Object.entries(pages)) {
    assert.match(page.html, /<main id="main"[^>]*>/);
    assert.equal((page.html.match(/<main\b/g) || []).length, 1, route);
    assert.match(page.html, /<h1\b/);
    assert.doesNotMatch(page.html, /(?:Homepage|Products|About|Locations|Contact)\.html/, route);
    assert.doesNotMatch(page.html, /<p class="note"[^>]*><\/p>/, route);
  }
});

test('internal page links resolve and runtime assets exist', async () => {
  const routes = new Set(Object.values(sitePaths));
  const markup = [...Object.values(pages).map(page => page.html), ...Object.values(shell)].join('');
  for (const match of markup.matchAll(/href="(\/[^"]*)"/g)) {
    const destination = match[1].split('#')[0];
    if (destination && destination !== '/assets/' && !destination.startsWith('/assets/')) {
      assert.ok(routes.has(destination), `Unknown internal route ${destination}`);
    }
  }
  for (const match of markup.matchAll(/\/assets\/([^"'\s>)]+)/g)) {
    await access(path.join(root, 'public/assets', match[1]));
  }
  const art = [...markup.matchAll(/\/illustrations\/([^"'\s>)]+)/g)].map(match => match[1]);
  assert.ok(art.length >= 9, 'Product and application imagery must be present across routes');
  for (const file of art) await access(path.join(root, 'public/illustrations', file));
  for (const route of Object.keys(pages)) {
    const ogRoute = route.startsWith('/products/starch-based-gums/') ? '/products/starch-based-gums' : route;
    const image = ogRoute === '/' ? 'home' : ogRoute.slice(1).replaceAll('/', '-');
    await access(path.join(root, 'public/og', `${image}.png`));
  }
});

test('every fragment resolves and placeholder links are modal actions', () => {
  const publicToRoute = new Map(Object.entries(sitePaths).map(([route, url]) => [url, route]));
  const entries = [...Object.entries(pages).map(([route, page]) => [route, page.html]), ...Object.entries(shell).map(([name, html]) => [name, html])];
  for (const [source, markup] of entries) {
    for (const match of markup.matchAll(/<a\b([^>]*)>/g)) {
      const attributes = match[1];
      const href = attributes.match(/\bhref="([^"]*)"/)?.[1];
      if (!href || !href.includes('#')) continue;
      if (href === '#') {
        assert.match(attributes, /\bdata-enquiry\b/, `${source} has an inert placeholder action`);
        continue;
      }
      const [url, fragment] = href.split('#');
      if (!fragment || !url.startsWith('/') && url !== '') continue;
      const targetRoute = url ? publicToRoute.get(url) : source;
      assert.ok(targetRoute && pages[targetRoute], `${source} points to unknown fragment route ${href}`);
      assert.ok(pages[targetRoute].html.includes(`id="${fragment}"`), `${source} points to missing fragment ${href}`);
    }
  }
});

test('public pages keep obsolete internal index labels out of view', () => {
  const markup = [...Object.values(pages).map(page => page.html), ...Object.values(shell)].join('');
  assert.doesNotMatch(markup, /class="(?:eyebrow|section-no|process-index|visual-record-kicker|visual-record-number|menu-index)"/);
  assert.doesNotMatch(markup, /<span class="overline">\s*\d{2}\s*<\/span>/);
});

test('homepage actions use dedicated routes and the mobile action is outside the header drawer', () => {
  const home = pages['/'].html;
  assert.doesNotMatch(home, /href="#(?:applications|products|capabilities|company|enquiry)"/);
  assert.match(home, new RegExp(`href="${sitePaths['/applications']}#paper"`));
  assert.match(home, new RegExp(`href="${sitePaths['/applications']}#packaging"`));
  assert.match(home, new RegExp(`href="${sitePaths['/applications']}#wood"`));
  assert.match(home, new RegExp(`href="${sitePaths['/products']}"`));
  assert.match(home, new RegExp(`href="${sitePaths['/products/synthetic-adhesives']}"`));
  assert.match(home, new RegExp(`href="${sitePaths['/products/starch-based-gums']}"`));
  assert.match(home, new RegExp(`href="${sitePaths['/products/wood-working-adhesives']}"`));
  assert.doesNotMatch(shell.header, /mobile-actions/);
  assert.match(shell.mobileActions, /class="mobile-actions"/);
  assert.match(shell.mobileActions, /data-enquiry/);
  assert.match(pages['/contact'].html, /id="enquiry"/);
});

test('every public section has a readable topic label and passive images have no action arrow', () => {
  for (const [route, page] of Object.entries(pages)) {
    const sections = (page.html.match(/<section\b/g) || []).length;
    const labels = [...page.html.matchAll(/<p class="section-context">(\d{2}) \/ ([^<]+)<\/p>/g)];
    assert.equal(labels.length, sections, `${route} needs a topic label for every section`);
    labels.forEach((label, index) => assert.equal(label[1], String(index + 1).padStart(2, '0'), `${route} cue order`));
    assert.doesNotMatch(page.html, /<figcaption>[^<]*<span[^>]*>[^<]*<\/span><\/figcaption>/, route);
  }
  const markup = [...Object.values(pages).map(page => page.html), ...Object.values(shell)].join('');
  assert.doesNotMatch(markup, /[\u00e2\u00c2\u00c3\u2014\u2197]/, 'No broken or glyph-only arrows and em dashes in public content');
  assert.doesNotMatch(markup, /PRODUCT INDEX/, 'No obsolete menu index label');
});
