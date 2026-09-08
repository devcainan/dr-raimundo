import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const URL = pathToFileURL(path.join(ROOT, 'index.html')).href;
const SHOTS = path.join(__dirname, 'shots');

const b = await chromium.launch();

async function shot(w, h, sel, name, pad = 16) {
  const c = await b.newContext({ viewport: { width: w, height: h } });
  const p = await c.newPage();
  await p.goto(URL);
  await p.waitForTimeout(1300);
  if (sel) {
    await p.locator(sel).scrollIntoViewIfNeeded();
    await p.waitForTimeout(700);
    const bb = await p.locator(sel).boundingBox();
    await p.screenshot({
      path: path.join(SHOTS, name + '.png'),
      clip: {
        x: Math.max(0, bb.x - pad),
        y: Math.max(0, bb.y - pad),
        width: Math.min(w - Math.max(0, bb.x - pad), bb.width + pad * 2),
        height: Math.min(h - Math.max(0, bb.y - pad), bb.height + pad * 2)
      }
    });
  } else {
    await p.screenshot({ path: path.join(SHOTS, name + '.png') });
  }
  await c.close();
}

await shot(1024, 820, null, 'hero-1024');
await shot(900, 800, '.cards', 'cards-900');
await shot(1024, 900, '.cards', 'cards-1024');
await shot(900, 900, '.quotes', 'quotes-900');
await shot(768, 900, '.ba-grid', 'bagrid-768');
await shot(1920, 900, null, 'hero-1920');
await shot(390, 844, '.ba--feature', 'slider-390');
await shot(390, 844, '.form-wrap', 'form-390');

await b.close();
console.log('shots ok');
