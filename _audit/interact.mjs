import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const URL = 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/');
const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const out = [];
const ok = (n, cond, extra = '') => out.push(`${cond ? 'OK  ' : 'FALHA'} | ${n}${extra ? ' | ' + extra : ''}`);
const info = (n, v) => out.push(`INFO  | ${n} | ${v}`);

const browser = await chromium.launch();

/* ============================ DESKTOP 1440 ============================ */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL); await page.waitForTimeout(1400);

  // --- skip link
  await page.keyboard.press('Tab');
  const skip = await page.evaluate(() => {
    const a = document.activeElement;
    const r = a.getBoundingClientRect();
    return { cls: a.className, visible: r.top >= 0, top: Math.round(r.top), outline: getComputedStyle(a).outlineWidth };
  });
  ok('skip link é o 1º foco e fica visível', skip.cls === 'skip-link' && skip.visible, JSON.stringify(skip));

  // --- ordem de tabulação até o formulário
  const order = [];
  for (let i = 0; i < 26; i++) {
    await page.keyboard.press('Tab');
    order.push(await page.evaluate(() => {
      const a = document.activeElement;
      const cs = getComputedStyle(a);
      return {
        tag: a.tagName.toLowerCase(),
        id: a.id || null,
        txt: (a.textContent || a.value || '').trim().replace(/\s+/g, ' ').slice(0, 26),
        outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0
      };
    }));
  }
  info('ordem de tabulação (26 primeiros)', order.map((o) => o.txt || o.id || o.tag).join(' > '));
  ok('todos os focos têm outline visível', order.every((o) => o.outline),
    'sem outline: ' + order.filter((o) => !o.outline).map((o) => o.txt || o.tag).join(', '));

  // --- header sticky
  const before = await page.evaluate(() => document.querySelector('[data-header]').className);
  await page.evaluate(() => window.scrollTo(0, 600)); await page.waitForTimeout(300);
  const after = await page.evaluate(() => document.querySelector('[data-header]').className);
  ok('header ganha fundo ao rolar', !before.includes('is-stuck') && after.includes('is-stuck'), `${before} -> ${after}`);

  // --- âncoras: o título de cada seção fica visível abaixo do header fixo?
  for (const id of ['sobre', 'procedimentos', 'resultados', 'depoimentos', 'contato']) {
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(200);
    await page.click(`.nav__list a[href="#${id}"]`);
    await page.waitForTimeout(900);
    const r = await page.evaluate((id) => {
      const sec = document.getElementById(id);
      const h = sec.querySelector('h2');
      const hd = document.querySelector('[data-header]').getBoundingClientRect();
      const hr = h.getBoundingClientRect();
      return { titleTop: Math.round(hr.top), headerBottom: Math.round(hd.bottom), coberto: hr.top < hd.bottom };
    }, id);
    ok(`âncora #${id} não esconde o título sob o header`, !r.coberto, JSON.stringify(r));
  }

  // --- FAQ: mouse + teclado
  await page.evaluate(() => document.getElementById('faq').scrollIntoView());
  await page.waitForTimeout(400);
  const t1 = page.locator('#faq-1-btn');
  await t1.click(); await page.waitForTimeout(500);
  ok('FAQ abre no clique', (await t1.getAttribute('aria-expanded')) === 'true' && !(await page.locator('#faq-1').isHidden()));
  await t1.click(); await page.waitForTimeout(500);
  ok('FAQ fecha no clique', (await t1.getAttribute('aria-expanded')) === 'false' && (await page.locator('#faq-1').isHidden()));
  await t1.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  ok('FAQ abre com Enter', (await t1.getAttribute('aria-expanded')) === 'true');
  await page.keyboard.press('Space'); await page.waitForTimeout(500);
  ok('FAQ fecha com Space', (await t1.getAttribute('aria-expanded')) === 'false');
  // dois abertos ao mesmo tempo?
  await page.locator('#faq-1-btn').click(); await page.locator('#faq-2-btn').click(); await page.waitForTimeout(500);
  info('vários painéis abertos simultaneamente', await page.locator('.faq__trigger[aria-expanded=true]').count() + ' de 4');

  // --- slider: arraste com mouse
  await page.evaluate(() => document.getElementById('resultados').scrollIntoView());
  await page.waitForTimeout(500);
  const frame = page.locator('[data-ba]').first();
  const box = await frame.boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.22, box.y + box.height * 0.5, { steps: 12 });
  await page.mouse.up();
  const posMouse = await frame.evaluate((el) => el.style.getPropertyValue('--pos'));
  ok('slider responde ao arraste do mouse', Math.abs(parseFloat(posMouse) - 22) < 4, `--pos=${posMouse}`);

  // arrasta para fora do quadro (deve ficar preso em 0/100)
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x - 400, box.y + box.height * 0.5, { steps: 6 });
  await page.mouse.up();
  const posClamp = await frame.evaluate((el) => el.style.getPropertyValue('--pos'));
  ok('slider limita em 0 ao sair do quadro', parseFloat(posClamp) === 0, `--pos=${posClamp}`);

  // teclado
  const handle = page.locator('[data-ba-handle]').first();
  await handle.focus();
  await page.keyboard.press('Home'); await page.waitForTimeout(120);
  const home = await handle.getAttribute('aria-valuenow');
  await page.keyboard.press('End'); await page.waitForTimeout(120);
  const end = await handle.getAttribute('aria-valuenow');
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft');
  const arrow = await handle.getAttribute('aria-valuenow');
  ok('slider por teclado (Home/End/setas)', home === '0' && end === '100' && arrow === '96', `${home}/${end}/${arrow}`);

  // clique simples num ponto do quadro
  await page.mouse.click(box.x + box.width * 0.8, box.y + box.height * 0.3);
  const posClick = await frame.evaluate((el) => el.style.getPropertyValue('--pos'));
  ok('clique simples reposiciona o slider', Math.abs(parseFloat(posClick) - 80) < 3, `--pos=${posClick}`);

  // --- formulário
  await page.evaluate(() => document.getElementById('contato').scrollIntoView());
  await page.waitForTimeout(400);
  await page.click('[data-form] button[type=submit]'); await page.waitForTimeout(300);
  const empty = await page.evaluate(() => ({
    erros: document.querySelectorAll('.field__error:not([hidden])').length,
    invalid: document.querySelectorAll('[aria-invalid=true]').length,
    foco: document.activeElement.id,
    status: document.querySelector('[data-form-status]').textContent.trim()
  }));
  ok('submit vazio mostra 2 erros e foca o 1º campo', empty.erros === 2 && empty.foco === 'nome', JSON.stringify(empty));

  await page.fill('#nome', 'Ana');
  await page.fill('#telefone', '8499');
  await page.click('[data-form] button[type=submit]'); await page.waitForTimeout(300);
  const short = await page.evaluate(() => ({
    erros: document.querySelectorAll('.field__error:not([hidden])').length,
    foco: document.activeElement.id
  }));
  ok('telefone curto é rejeitado', short.erros === 1 && short.foco === 'telefone', JSON.stringify(short));

  // máscara
  await page.fill('#telefone', '');
  await page.type('#telefone', '84999887766', { delay: 12 });
  const mask = await page.inputValue('#telefone');
  ok('máscara de celular (11 dígitos)', mask === '(84) 99988-7766', mask);
  await page.fill('#telefone', '');
  await page.type('#telefone', '8433221100', { delay: 12 });
  const mask10 = await page.inputValue('#telefone');
  ok('máscara de fixo (10 dígitos)', mask10 === '(84) 3322-1100', mask10);

  // edição no meio do número (regressão de cursor)
  await page.fill('#telefone', '');
  await page.type('#telefone', '84999887766', { delay: 8 });
  await page.evaluate(() => { const i = document.getElementById('telefone'); i.setSelectionRange(5, 5); });
  await page.keyboard.type('1');
  const midEdit = await page.evaluate(() => ({ v: document.getElementById('telefone').value, caret: document.getElementById('telefone').selectionStart }));
  info('editar no meio do telefone', `valor="${midEdit.v}" cursor=${midEdit.caret}`);

  // envio válido
  await page.fill('#nome', 'Ana Souza');
  await page.fill('#telefone', '');
  await page.type('#telefone', '84999887766', { delay: 8 });
  await page.click('[data-form] button[type=submit]'); await page.waitForTimeout(300);
  const valid = await page.evaluate(() => ({
    status: document.querySelector('[data-form-status]').textContent.trim().slice(0, 60),
    nome: document.getElementById('nome').value,
    erros: document.querySelectorAll('.field__error:not([hidden])').length
  }));
  ok('envio válido limpa o formulário e avisa', valid.nome === '' && valid.status.length > 0, JSON.stringify(valid));
  await page.screenshot({ path: path.join(SHOTS, 'form-sucesso.png'), clip: await page.locator('.form-wrap').boundingBox() });

  await ctx.close();
}

/* ============================= MOBILE 390 ============================= */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(URL); await page.waitForTimeout(1400);

  const toggle = page.locator('[data-nav-toggle]');
  const nav = page.locator('#nav-principal');

  await toggle.click(); await page.waitForTimeout(400);
  ok('menu abre', (await toggle.getAttribute('aria-expanded')) === 'true' && await nav.isVisible());

  // conteúdo de fundo ainda recebe foco com o menu aberto?
  const leak = await page.evaluate(() => {
    const nav = document.getElementById('nav-principal');
    const focusables = [...document.querySelectorAll('a[href], button, input, [tabindex]:not([tabindex="-1"])')];
    const fora = focusables.filter((el) => !nav.contains(el) && el.offsetParent !== null && !el.closest('[data-header]'));
    return fora.length;
  });
  ok('menu aberto não deixa o fundo focável', leak === 0, `${leak} elementos do fundo ainda tabuláveis`);

  // rolagem de fundo travada?
  const scrollLock = await page.evaluate(async () => {
    const y0 = window.scrollY;
    window.scrollTo(0, 500);
    await new Promise((r) => setTimeout(r, 200));
    const y1 = window.scrollY;
    window.scrollTo(0, y0);
    return y1;
  });
  ok('página não rola com o menu aberto', scrollLock === 0, `scrollY chegou a ${scrollLock}`);

  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  const escState = await page.evaluate(() => ({
    exp: document.querySelector('[data-nav-toggle]').getAttribute('aria-expanded'),
    foco: document.activeElement.className
  }));
  ok('Escape fecha e devolve o foco ao botão', escState.exp === 'false' && escState.foco.includes('nav-toggle'), JSON.stringify(escState));

  await toggle.click(); await page.waitForTimeout(300);
  await page.click('#nav-principal a[href="#procedimentos"]'); await page.waitForTimeout(900);
  const afterLink = await page.evaluate(() => ({
    exp: document.querySelector('[data-nav-toggle]').getAttribute('aria-expanded'),
    y: Math.round(window.scrollY),
    tituloTop: Math.round(document.querySelector('#procedimentos h2').getBoundingClientRect().top),
    headerBottom: Math.round(document.querySelector('[data-header]').getBoundingClientRect().bottom)
  }));
  ok('link do menu fecha o menu e rola até a seção',
    afterLink.exp === 'false' && afterLink.tituloTop >= afterLink.headerBottom, JSON.stringify(afterLink));

  // slider por toque
  await page.evaluate(() => document.getElementById('resultados').scrollIntoView());
  await page.waitForTimeout(400);
  const frame = page.locator('[data-ba]').first();
  const box = await frame.boundingBox();
  const touchDrag = await frame.evaluate((el, b) => {
    const send = (type, x) => el.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: 1, pointerType: 'touch', isPrimary: true,
      clientX: x, clientY: b.y + b.height / 2, button: 0
    }));
    const rect = el.getBoundingClientRect();
    send('pointerdown', rect.left + rect.width * 0.5);
    send('pointermove', rect.left + rect.width * 0.28);
    send('pointerup', rect.left + rect.width * 0.28);
    return el.style.getPropertyValue('--pos');
  }, box);
  ok('slider responde a toque (pointerType=touch)', Math.abs(parseFloat(touchDrag) - 28) < 4, `--pos=${touchDrag}`);

  // touch-action permite rolar a página verticalmente sobre o slider
  const ta = await frame.evaluate((el) => getComputedStyle(el).touchAction);
  ok('slider não bloqueia a rolagem vertical', ta === 'pan-y', `touch-action: ${ta}`);

  await ctx.close();
}

/* ======================= MOVIMENTO REDUZIDO ========================== */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(URL); await page.waitForTimeout(1400);

  const art = await page.evaluate(() => {
    const p = document.querySelector('.profile-art__line');
    const d = document.querySelector('.profile-art__dot');
    const cs = getComputedStyle(p);
    return { dash: cs.strokeDasharray, offset: cs.strokeDashoffset, dotOpacity: getComputedStyle(d).opacity };
  });
  ok('traçado do perfil já nasce completo', art.dash === 'none' && art.dotOpacity === '1', JSON.stringify(art));

  await page.evaluate(() => document.getElementById('depoimentos').scrollIntoView());
  await page.waitForTimeout(500);
  const revealed = await page.evaluate(() =>
    [...document.querySelectorAll('[data-reveal]')].every((e) => getComputedStyle(e).opacity === '1'));
  ok('blocos de prova visíveis sem animação', revealed);

  await page.locator('#faq-1-btn').click(); await page.waitForTimeout(300);
  ok('FAQ funciona com movimento reduzido',
    (await page.locator('#faq-1-btn').getAttribute('aria-expanded')) === 'true' && await page.locator('#faq-1').isVisible());

  const sb = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
  ok('rolagem suave desativada', sb === 'auto', sb);
  await ctx.close();
}

/* ============================== SEM JS =============================== */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(URL); await page.waitForTimeout(800);
  const noJs = await page.evaluate(() => 1).catch(() => null);
  const state = await page.locator('.profile-art__line').evaluate((el) => {
    const cs = getComputedStyle(el);
    return { dash: cs.strokeDasharray, offset: cs.strokeDashoffset };
  });
  const dot = await page.locator('.profile-art__dot').first().evaluate((el) => getComputedStyle(el).opacity);
  const ano = await page.locator('[data-year]').textContent();
  const faqVisivel = await page.locator('#faq-1').isHidden();
  out.push(`INFO  | sem JS | traçado=${JSON.stringify(state)} marcador=${dot} ano="${ano}" faq-fechado=${faqVisivel}`);
  ok('sem JS o traçado e os marcadores aparecem', dot === '1');
  await page.screenshot({ path: path.join(SHOTS, 'sem-js.png') });
  await ctx.close();
}

await browser.close();
console.log(out.join('\n'));
