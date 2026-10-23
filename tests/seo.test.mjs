import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const paths = ['/', '/kurzusok', '/szuloknek', '/diakoknak', '/erettsegi-feladatsorok', '/programozas-izelito', '/jelentkezes', '/oktatas-menete', '/oktatok', '/arak', '/gyik', '/helyszin', '/kapcsolat', '/adatkezeles', '/impresszum', '/belepes', '/tanulo', '/admin'];
test('Every route has prerendered body, one H1, unique title and canonical URL', async () => {
  const titles = new Set();
  for (const path of paths) {
    const html = await readFile(path === '/' ? 'dist/index.html' : `dist${path}/index.html`, 'utf8');
    assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1, path);
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    assert.ok(title, path); assert.ok(!titles.has(title), `Duplicate title on ${path}`); titles.add(title);
    assert.ok(html.includes(`rel="canonical" href="https://diku-erettsegi.hu${path === '/' ? '' : path}"`), path);
    assert.ok(html.includes('name="description"'), path);
    assert.ok(html.includes('application/ld+json'), path);
    assert.ok(html.includes('<html lang="hu">'), path);
    assert.ok(!html.includes('<!--app-->'), path);
  }
});
test('Private routes and legal drafts stay outside search indexes', async () => {
  const sitemap = await readFile('dist/sitemap.xml', 'utf8');
  for (const path of ['/belepes', '/admin', '/tanulo', '/adatkezeles', '/impresszum', '/programozas-izelito']) {
    const html = await readFile(`dist${path}/index.html`, 'utf8');
    assert.ok(html.includes('noindex, nofollow'), path); assert.ok(!sitemap.includes(path), path);
  }
});
test('No invented ratings or external analytics in generated site', async () => {
  const html = await readFile('dist/index.html', 'utf8');
  assert.ok(!/googletagmanager|google-analytics|fbq\(/.test(html));
  assert.ok(!html.includes('AggregateRating')); assert.ok(!html.includes('PostalAddress'));
});
test('Known course facts and approved pricing remain visible without JavaScript', async () => {
  const home = await readFile('dist/index.html', 'utf8');
  assert.ok(home.includes('2027. január 9.'));
  assert.ok(home.includes('tanóra, 20 alkalom'));
  assert.ok(home.includes('href="/kurzusok"'));
  const pricing = await readFile('dist/arak/index.html', 'utf8');
  for (const amount of ['280 000', '210 000', '238 000', '196 000', '182 000', '224 000']) assert.ok(pricing.includes(amount), amount);
  assert.ok(pricing.includes('legfeljebb 35%'));
  assert.ok(!pricing.includes('összevonhatósága'));
});
test('Exam downloads link to the official publisher and identify file types', async () => {
  const html = await readFile('dist/erettsegi-feladatsorok/index.html', 'utf8');
  const links = [...html.matchAll(/href="(https:[^"]+\.(?:pdf|zip))"/g)].map(match => match[1]);
  assert.equal(links.length, 20);
  assert.ok(links.every(link => new URL(link).hostname === 'www.oktatas.hu'));
  assert.ok(html.includes('Javítási útmutató · PDF'));
  assert.ok(html.includes('Forrásfájlok · ZIP'));
});
test('Public stock photos are local, credited, and explicitly illustrative', async () => {
  const html = await readFile('dist/index.html', 'utf8');
  assert.ok(html.includes('/images/stock-tantermi-tanulas.webp'));
  assert.ok(html.includes('/images/stock-kozos-feladatmegoldas.webp'));
  assert.ok(html.includes('Stockillusztráció'));
  assert.ok(html.includes('Ivan S')); assert.ok(html.includes('cottonbro studio'));
  assert.ok(!html.includes('src="https://'));
});
