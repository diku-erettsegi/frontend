import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pages, seoMarkup, origin, render } from '../.ssr/entry-server.js';
const template = await readFile('dist/index.html', 'utf8');
for (const path of [...Object.keys(pages), '/404']) {
  const html = template.replace('<!--seo-->', seoMarkup(path)).replace('<!--app-->', render(path));
  const output = path === '/' ? 'dist/index.html' : path === '/404' ? 'dist/404.html' : join('dist', path.slice(1), 'index.html');
  if (path !== '/' && path !== '/404') await mkdir(join('dist', path.slice(1)), { recursive: true });
  await writeFile(output, html);
}
const urls = Object.entries(pages).filter(([, page]) => !page.noindex).map(([path]) => `<url><loc>${origin}${path === '/' ? '' : path}</loc></url>`).join('');
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`Prerendered ${Object.keys(pages).length} routes and a 404 page; generated sitemap.xml + robots.txt.`);
