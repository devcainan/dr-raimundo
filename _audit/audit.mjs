import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const URL = 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/');
const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
const AXE = fs.readFileSync(path.join(ROOT, 'node_modules/axe-core/axe.min.js'), 'utf8');

const report = { viewports: {}, interactions: {}, meta: {}, console: [], axe: {}, perf: {} };
const log = (...a) => console.log(...a);

const VIEWPORTS = [
  { name: '360x740', width: 360, height: 740, mobile: true },
  { name: '390x844', width: 390, height: 844, mobile: true },
  { name: '768x1024', width: 768, height: 1024, mobile: true },
  { name: '1024x768', width: 1024, height: 768, mobile: false },
  { name: '1440x900', width: 1440, height: 900, mobile: false },
  { name: '1920x1080', width: 1920, height: 1080, mobile: false }
];

/* ---------------------------------------------------------------- helpers */

async function collectLayout(page, vp) {
  return page.evaluate((vp) => {
    const out = {};
    const de = document.documentElement;
    out.horizontalOverflow = de.scrollWidth - de.clientWidth;
    out.pageHeight = de.scrollHeight;

    // elementos que passam da largura da viewport
    const wide = [];
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed') return;
      if (r.right > de.clientWidth + 1 || r.left < -1) {
        // ignora o que está deliberadamente clipado por um ancestral com overflow hidden
        let p = el.parentElement, clipped = false;
        while (p) {
          const pc = getComputedStyle(p);
          if (pc.overflow !== 'visible' || pc.overflowX !== 'visible') { clipped = true; break; }
          p = p.parentElement;
        }
        if (!clipped) {
          wide.push({
            sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''),
            left: Math.round(r.left), right: Math.round(r.right)
          });
        }
      }
    });
    out.overflowingElements = wide.slice(0, 12);

    // texto muito pequeno
    const small = [];
    document.querySelectorAll('p, li, span, a, label, button, figcaption, blockquote').forEach((el) => {
      if (!el.textContent.trim()) return;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 12) small.push({ sel: el.className || el.tagName, px: fs, text: el.textContent.trim().slice(0, 40) });
    });
    out.smallText = small.slice(0, 10);

    // alvos de toque pequenos (< 44px em qualquer eixo)
    const targets = [];
    document.querySelectorAll('a, button, input, [role="slider"], [tabindex]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.height < 44 || r.width < 24) {
        targets.push({
          sel: el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/)[0] : ''),
          text: (el.textContent || el.value || '').trim().slice(0, 28),
          w: Math.round(r.width), h: Math.round(r.height)
        });
      }
    });
    out.smallTapTargets = targets.slice(0, 14);

    // comprimento de linha em caracteres (blocos de leitura)
    const lines = [];
    document.querySelectorAll('p').forEach((el) => {
      const t = el.textContent.trim();
      if (t.length < 90) return;
      const cs = getComputedStyle(el);
      const probe = document.createElement('span');
      probe.style.font = cs.font;
      probe.style.visibility = 'hidden';
      probe.style.position = 'absolute';
      probe.style.whiteSpace = 'pre';
      probe.textContent = 'abcdefghijklmnopqrstuvwxyz';
      document.body.appendChild(probe);
      const perChar = probe.getBoundingClientRect().width / 26;
      probe.remove();
      const chars = Math.round(el.getBoundingClientRect().width / perChar);
      lines.push({ chars, cls: el.className || el.parentElement.className, text: t.slice(0, 34) });
    });
    out.longestLines = lines.sort((a, b) => b.chars - a.chars).slice(0, 6);

    return out;
  }, vp);
}

async function runAxe(page) {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async () => {
    const res = await window.axe.run(document, {
      resultTypes: ['violations', 'incomplete'],
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] }
    });
    const pick = (arr) => arr.map((v) => ({
      id: v.id, impact: v.impact, help: v.help,
      nodes: v.nodes.slice(0, 4).map((n) => ({
        target: n.target.join(' '),
        summary: (n.failureSummary || '').split('\n').filter(Boolean).slice(1, 3).join(' | ')
      }))
    }));
    return { violations: pick(res.violations), incomplete: pick(res.incomplete) };
  });
}

/* ------------------------------------------------------------------- main */

const browser = await chromium.launch();

/* 1. varredura por viewport ------------------------------------------- */
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    hasTouch: vp.mobile,
    isMobile: false,
    deviceScaleFactor: 1
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(`[${vp.name}] ${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => errs.push(`[${vp.name}] pageerror: ${e.message}`));
  page.on('requestfailed', (r) => errs.push(`[${vp.name}] requestfailed: ${r.url().slice(0, 90)} ${r.failure()?.errorText}`));

  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(1600);

  report.viewports[vp.name] = await collectLayout(page, vp);
  report.console.push(...errs);

  await page.screenshot({ path: path.join(SHOTS, `full-${vp.name}.png`), fullPage: true });
  await ctx.close();
}

/* 2. meta / SEO / estrutura ------------------------------------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(1200);

  report.meta = await page.evaluate(() => {
    const q = (s, a = 'content') => { const e = document.querySelector(s); return e ? e.getAttribute(a) : null; };
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({
      level: +h.tagName[1], text: h.textContent.trim().replace(/\s+/g, ' ').slice(0, 52)
    }));
    let prev = 0; const jumps = [];
    headings.forEach((h) => { if (prev && h.level > prev + 1) jumps.push(`${prev} -> ${h.level}: ${h.text}`); prev = h.level; });

    return {
      lang: document.documentElement.lang,
      title: document.title,
      titleLength: document.title.length,
      description: q('meta[name=description]'),
      descriptionLength: (q('meta[name=description]') || '').length,
      ogImage: q('meta[property="og:image"]'),
      ogUrl: q('meta[property="og:url"]'),
      canonical: q('link[rel=canonical]', 'href'),
      favicon: !!document.querySelector('link[rel*=icon]'),
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].length,
      h1Count: document.querySelectorAll('h1').length,
      headings,
      headingJumps: jumps,
      landmarks: {
        header: document.querySelectorAll('header').length,
        nav: document.querySelectorAll('nav').length,
        main: document.querySelectorAll('main').length,
        footer: document.querySelectorAll('footer').length,
        sections: document.querySelectorAll('section').length,
        sectionsWithoutName: [...document.querySelectorAll('section')]
          .filter((s) => !s.getAttribute('aria-label') && !s.getAttribute('aria-labelledby') && !s.querySelector('h1,h2,h3'))
          .length
      },
      imgsWithoutAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
      imgCount: document.querySelectorAll('img').length,
      linksNoName: [...document.querySelectorAll('a')].filter((a) => !a.textContent.trim() && !a.getAttribute('aria-label')).length,
      externalLinksNoRel: [...document.querySelectorAll('a[target=_blank]')].filter((a) => !(a.rel || '').includes('noopener')).length,
      fontsUsed: [...new Set([...document.querySelectorAll('h1,h2,h3,p,button,a,span')].map((e) => getComputedStyle(e).fontFamily.split(',')[0].replace(/"/g, '')))],
      formFields: [...document.querySelectorAll('input,select,textarea')].map((i) => ({
        id: i.id, type: i.type, required: i.required,
        label: !!document.querySelector(`label[for="${i.id}"]`),
        autocomplete: i.getAttribute('autocomplete')
      })),
      stylesheets: [...document.styleSheets].map((s) => (s.href || 'inline')),
      scriptCount: document.querySelectorAll('script[src]').length
    };
  });

  report.perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const res = performance.getEntriesByType('resource');
    return {
      resourceCount: res.length,
      totalTransferKB: Math.round(res.reduce((a, r) => a + (r.transferSize || 0), 0) / 1024),
      slowest: res.map((r) => ({ n: r.name.split('/').pop().slice(0, 40), ms: Math.round(r.duration) }))
        .sort((a, b) => b.ms - a.ms).slice(0, 5),
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
      loadComplete: Math.round(nav.loadEventEnd || 0),
      fontsLoaded: document.fonts ? document.fonts.status : 'n/a'
    };
  });

  report.axe = await runAxe(page);
  await ctx.close();
}

fs.writeFileSync(path.join(__dirname, 'report.json'), JSON.stringify(report, null, 2));
log(JSON.stringify({ viewports: report.viewports, meta: report.meta, perf: report.perf, console: report.console, axe: report.axe }, null, 1));
await browser.close();
