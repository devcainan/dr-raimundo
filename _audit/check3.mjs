import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const URL = pathToFileURL(path.join(ROOT, 'index.html')).href;

const b = await chromium.launch();

for (const [w, h] of [[390, 844], [1440, 900]]) {
  const c = await b.newContext({ viewport: { width: w, height: h } });
  const p = await c.newPage();
  await p.goto(URL);
  await p.waitForTimeout(1300);

  const r = await p.evaluate(() => {
    const secs = [...document.querySelectorAll('section, footer')].map((s) => ({
      id: s.id || s.className.split(' ')[0],
      alt: Math.round(s.getBoundingClientRect().height)
    }));
    const inp = document.getElementById('nome');
    const cs = getComputedStyle(inp);
    const frame = document.querySelector('.ba__frame');
    const fr = frame.getBoundingClientRect();
    const before = frame.querySelector('.ba__layer--before .ph__text').getBoundingClientRect();
    const after = frame.querySelector('.ba__layer--after .ph__text').getBoundingClientRect();
    return {
      secs,
      total: document.documentElement.scrollHeight,
      inputFontPx: parseFloat(cs.fontSize),
      slider: {
        w: Math.round(fr.width), h: Math.round(fr.height),
        proporcao: (fr.width / fr.height).toFixed(2),
        textosSobrepostos: before.right > after.left,
        folga: Math.round(after.left - before.right)
      }
    };
  });

  console.log(`\n=== ${w}x${h} === pagina ${r.total}px | input ${r.inputFontPx}px ${r.inputFontPx < 16 ? '(ZOOM NO iOS)' : '(ok)'}`);
  console.log('  slider:', JSON.stringify(r.slider));
  r.secs.forEach((s) => console.log(`  ${String(s.alt).padStart(5)}px  ${s.id}`));
  await c.close();
}

await b.close();
