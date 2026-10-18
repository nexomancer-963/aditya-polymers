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
    assert.match(page.html, /<main id="main">/);
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
  assert.equal(art.length, new Set(art).size, 'Editorial illustrations must not repeat across pages');
  for (const file of art) await access(path.join(root, 'public/illustrations', file));
  for (const route of Object.keys(pages)) {
    const image = route === '/' ? 'home' : route.slice(1).replaceAll('/', '-');
    await access(path.join(root, 'public/og', `${image}.png`));
  }
});
