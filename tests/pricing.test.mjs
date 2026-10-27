import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let vite, PriceDisplay, DiscountBadge;
before(async () => {
  vite = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
  ({ PriceDisplay, DiscountBadge } = await vite.ssrLoadModule('/src/PriceDisplay.tsx'));
});
after(async () => { await vite?.close(); });
const render = props => renderToStaticMarkup(createElement(PriceDisplay, props)).replace(/\u00a0/g, ' ');

test('Discounted quote displays original, total, per-lesson price and actual savings', () => {
  const html = render({ baseTotal: 280000, total: 182000, perLesson: 2275, lessonCount: 80 });
  for (const value of ['<s>280 000 Ft</s>', '182 000', '98 000 Ft megtakarítás', '2 275 Ft / tanóra', '3 500 Ft']) assert.ok(html.includes(value), value);
});
test('Full-price quote never suggests a discount or zero savings', () => {
  const html = render({ baseTotal: 280000, total: 280000, perLesson: 3500, lessonCount: 80 });
  assert.ok(!html.includes('<s>'));
  assert.ok(!html.includes('megtakarítás'));
  assert.equal(renderToStaticMarkup(createElement(DiscountBadge, { percent: 0 })), '');
});
test('Historical quotes use their own amounts and never invent a missing original price', () => {
  const saved = render({ baseTotal: 300000, total: 225000, perLesson: 2812.5, compact: true });
  for (const value of ['300 000 Ft', '225 000', '75 000 Ft megtakarítás', '2 812,5 Ft / tanóra']) assert.ok(saved.includes(value), value);
  const receipt = render({ total: 225000, perLesson: 2812.5 });
  assert.ok(receipt.includes('225 000'));
  assert.ok(!receipt.includes('<s>'));
  assert.ok(!receipt.includes('megtakarítás'));
  assert.ok(!receipt.includes('280 000'));
});
