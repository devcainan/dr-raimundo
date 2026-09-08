import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const URL = pathToFileURL(path.join(ROOT, 'index.html')).href;
const SHOTS = path.join(__dirname, 'shots');

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto(URL);
await p.waitForTimeout(1400);

await p.keyboard.press('Tab');
await p.waitForTimeout(500);
const skip = await p.evaluate(() => {
  const a = document.activeElement, r = a.getBoundingClientRect(), cs = getComputedStyle(a);
  return { cls: a.className, top: Math.round(r.top), h: Math.round(r.height), bg: cs.backgroundColor, z: cs.zIndex };
});
console.log('skip link apos transicao:', JSON.stringify(skip));
await p.screenshot({ path: path.join(SHOTS, 'skiplink.png'), clip: { x: 0, y: 0, width: 760, height: 130 } });

await p.evaluate(() => document.getElementById('resultados').scrollIntoView());
await p.waitForTimeout(400);
await p.locator('[data-ba-handle]').first().focus();
const fh = await p.locator('[data-ba-handle]').first().evaluate((el) => {
  const cs = getComputedStyle(el);
  return { outline: cs.outlineWidth + ' ' + cs.outlineStyle + ' ' + cs.outlineColor };
});
console.log('foco no handle do slider:', JSON.stringify(fh));
const bb = await p.locator('.ba--feature').boundingBox();
await p.screenshot({ path: path.join(SHOTS, 'slider-foco.png'), clip: { x: bb.x - 12, y: bb.y - 12, width: bb.width + 24, height: 220 } });

const ctx2 = await b.newContext({ viewport: { width: 360, height: 740 } });
const p2 = await ctx2.newPage();
await p2.goto(URL);
await p2.waitForTimeout(1000);
const tag = await p2.evaluate(() => {
  const t = [...document.querySelectorAll('.ph__tag')].map((el) => {
    const r = el.getBoundingClientRect();
    return { txt: el.textContent.trim().slice(0, 34), w: Math.round(r.width), right: Math.round(r.right), ws: getComputedStyle(el).whiteSpace };
  });
  return { transbordam: t.filter((x) => x.right > 360), docW: document.documentElement.scrollWidth };
});
console.log('tags que transbordam em 360:', JSON.stringify(tag));
await ctx2.close();

for (const h of [640, 768, 900]) {
  const c = await b.newContext({ viewport: { width: 1024, height: h } });
  const pg = await c.newPage();
  await pg.goto(URL);
  await pg.waitForTimeout(1200);
  const m = await pg.evaluate(() => {
    const hero = document.querySelector('.hero').getBoundingClientRect();
    const cta = document.querySelector('.hero__actions .btn').getBoundingClientRect();
    const h1 = document.querySelector('.hero__title').getBoundingClientRect();
    return { heroH: Math.round(hero.height), h1Top: Math.round(h1.top), ctaBottom: Math.round(cta.bottom), vh: window.innerHeight };
  });
  console.log(`1024x${h} -> hero ${m.heroH}px | h1 comeca em ${m.h1Top} | CTA termina em ${m.ctaBottom} (dobra ${m.vh}) ${m.ctaBottom > m.vh ? '>>> CTA ABAIXO DA DOBRA' : 'CTA visivel'}`);
  await c.close();
}

await b.close();
