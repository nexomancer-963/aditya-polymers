import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const content = new URL('../src/content/', import.meta.url);

async function readJson(file) {
  return JSON.parse(await readFile(new URL(file, content), 'utf8'));
}

test('every typed page maps to one unique public URL in this deployable checkout', async () => {
  const pages = await readJson('generated/pages.json');
  const sitePaths = await readJson('site-paths.json');
  const routeSource = await readFile(new URL('routes.ts', content), 'utf8');

  assert.deepEqual(Object.keys(sitePaths).sort(), Object.keys(pages).sort());
  assert.equal(new Set(Object.values(sitePaths)).size, Object.keys(pages).length);
  assert.match(routeSource, /sitePaths satisfies Record<SiteRoute, string>/);
});

test('homepage and established product/contact URLs remain mapped', async () => {
  const sitePaths = await readJson('site-paths.json');

  assert.equal(sitePaths['/'], '/');
  assert.equal(sitePaths['/products'], '/aditya-polymers-products.html');
  assert.equal(sitePaths['/about'], '/about-aditya-polymers.html');
  assert.equal(Object.hasOwn(sitePaths, '/locations'), false);
  assert.equal(sitePaths['/contact'], '/contact.html');
});
