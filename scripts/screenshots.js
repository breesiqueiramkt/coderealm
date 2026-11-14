#!/usr/bin/env node
/* Gera as imagens da documentação (docs/screenshots/*.webp) e a capa (assets/og-image.png)
   abrindo o jogo de verdade num Chromium sem janela.  Rode: npm run screenshots
   Precisa do Playwright (npm install) e do Python com Pillow para converter em WebP. */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { createServer } = require('./serve');

const OUT = path.resolve(__dirname, '..', 'docs', 'screenshots');
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
fs.mkdirSync(OUT, { recursive: true });

// Save de demonstração: algumas fases feitas, personagem estiloso, moedas
const DEMO = `(() => {
  Object.assign(state, { name: 'Breno', coins: 340, level: 4, xp: 120 });
  ['vale', 'rio', 'portao', 'forja'].forEach((p, i) => { state.done[p] = true; state.stars[p] = i === 3 ? 2 : 3; state.talked[p] = true; });
  state.inventory = ['manto-semantica-html', 'cinto-flexbox', 'pergaminho-condicao', 'botas-container'];
  Object.assign(state.look, { hat: 'mago', pet: 'coruja', cape: 'capa', scarf: '#f5c542', outfit: '#2496ed', hairStyle: 'espetado' });
  state.owned['hat:mago'] = state.owned['pet:coruja'] = state.owned['cape:capa'] = state.owned['hairStyle:espetado'] = true;
  state.talked.reitora = true;
  settings.quality = 'alta'; /* evita o aviso de modo desempenho do Chromium sem GPU */
  settings.tutorialSeen = true; rebuildPlayer(); renderHud(); Rewards.check(); buildWorld();
})()`;

(async () => {
  const server = createServer().listen(0);
  const base = `http://localhost:${server.address().port}/?nosw`;
  const browser = await chromium.launch({ args: GL });
  const shots = [];
  const shot = async (page, name) => {
    const file = path.join(OUT, name + '.png');
    await page.screenshot({ path: file });
    shots.push(file);
    console.log('  ✓', name);
  };
  const wait = ms => new Promise(r => setTimeout(r, ms));

  // ---------- desktop ----------
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 760 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  await page.goto(base);
  await page.waitForFunction(() => window.CodeRealm);
  await page.evaluate(DEMO);
  await page.evaluate(() => {
    document.querySelector('#ach-pop').style.display = 'none';
  }); // sem popups nas fotos
  await page.click('[data-tab="home"]');
  await wait(400);
  await shot(page, 'menu');

  await page.click('#btn-play');
  await page.evaluate(() => Object.assign(state.player, { x: 10, y: 6, px: 10, py: 6, dir: 'down' }));
  await wait(2500);
  await shot(page, 'academia');

  await page.evaluate(() => {
    state.talked.portos = false;
    changeMap('portos');
  });
  await page.waitForFunction(() => state.map === 'portos' && !state.locked);
  await page.evaluate(() => Object.assign(state.player, { x: 6, y: 8, px: 6, py: 8, dir: 'left' }));
  await wait(2500);
  await shot(page, 'fase-porto');

  await page.evaluate(() => {
    state.talked.portos = true;
    UI.openObstacle('portos');
  });
  for (const c of ['docker images', 'docker run -d --name farol nginx:latest', 'docker ps']) {
    await page.fill('#modal #term-in', c);
    await page.press('#modal #term-in', 'Enter');
  }
  await wait(400);
  await shot(page, 'desafio-terminal');
  await page.click('#modal-close');

  await page.evaluate(() => {
    changeMap('rio');
  });
  await page.waitForFunction(() => state.map === 'rio' && !state.locked);
  await page.evaluate(() => {
    state.solved.rio = false;
    state.talked.rio = true;
    UI.openObstacle('rio', true);
  });
  await page.fill(
    '#css-editor',
    '.rio {\n  display: flex;\n  justify-content: space-around;\n  align-items: center;\n}\n\n.plataforma {\n  width: 60px;\n  height: 44px;\n}',
  );
  await wait(900);
  await shot(page, 'desafio-css');
  await page.click('#modal-close');

  await page.keyboard.press('Escape');
  await page.click('[data-tab="character"]');
  await wait(1500);
  await shot(page, 'personagem');

  await page.click('[data-tab="arena"]');
  await page.click('.practice-card.project:has-text("Contador") .btn');
  await page.fill(
    '#pg-js',
    'const v = document.getElementById("valor");\nlet n = 0;\nconst up = () => { v.textContent = n; v.classList.toggle("negativo", n < 0); };\ndocument.getElementById("mais").onclick = () => { n++; up(); };\ndocument.getElementById("menos").onclick = () => { n--; up(); };',
  );
  await page.click('#proj-verify');
  await page.waitForFunction(() => /completo/.test(document.querySelector('#proj-fb').textContent));
  await page.evaluate(() => document.querySelector('.hub-main').scrollTo(0, 0));
  await wait(300);
  await shot(page, 'arena-projeto');

  await page.evaluate(() => {
    Object.keys(PHASES).forEach(p => {
      state.done[p] = true;
      state.stars[p] = 3;
    });
    state.exam = { score: 9, total: 10, date: '2026-11-13', code: 'CR-1A2B3C4' };
    Certificate.show();
  });
  await wait(600);
  await shot(page, 'certificado');
  await ctx.close();

  // ---------- celular ----------
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const mp = await phone.newPage();
  await mp.goto(base);
  await mp.waitForFunction(() => window.CodeRealm);
  await mp.evaluate(DEMO);
  await mp.evaluate(() => {
    document.querySelector('#ach-pop').style.display = 'none';
  });
  await mp.click('#btn-play');
  await wait(2500);
  await shot(mp, 'celular');
  await phone.close();

  // ---------- capa (Open Graph / redes sociais) 1280x640 ----------
  const og = await browser.newPage({ viewport: { width: 1280, height: 640 } });
  const bg = 'data:image/png;base64,' + fs.readFileSync(path.join(OUT, 'academia.png')).toString('base64');
  await og.setContent(`<html><body style="margin:0;width:1280px;height:640px;font-family:Nunito,Arial,sans-serif;background:#1a1626 url(${bg}) center/cover;">
    <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(26,22,38,.97) 0%,rgba(26,22,38,.86) 46%,rgba(26,22,38,.15) 100%)"></div>
    <div style="position:absolute;left:72px;top:110px;width:640px;color:#f3eee6">
      <div style="display:flex;align-items:center;gap:18px"><div style="width:76px;height:76px;border-radius:18px;background:linear-gradient(#8b5cf6,#4b2fa0);display:grid;place-items:center;color:#f5c542;font:700 32px monospace;box-shadow:0 0 0 4px #1a1626,0 0 0 7px #f5c542">{ }</div><div style="font-weight:900;font-size:56px">CodeRealm</div></div>
      <div style="font-weight:900;font-size:40px;line-height:1.15;margin:34px 0 18px">RPG 3D para aprender<br>HTML, CSS, JavaScript e Docker</div>
      <div style="font-size:24px;color:#b9b0c9;line-height:1.4">8 fases · desafios reais no editor e no terminal · grátis, no navegador e offline</div>
    </div></body></html>`);
  await wait(300);
  await og.screenshot({ path: path.resolve(__dirname, '..', 'assets', 'og-image.png') });
  console.log('  ✓ assets/og-image.png');

  await browser.close();
  server.close();

  // PNG → WebP (bem menor no repositório)
  execFileSync('python3', [
    '-c',
    `
import sys
from PIL import Image
for f in sys.argv[1:]:
    Image.open(f).convert('RGB').save(f[:-4] + '.webp', 'WEBP', quality=86, method=6)
`,
    ...shots,
  ]);
  shots.forEach(f => fs.unlinkSync(f));
  console.log(`Prontas em docs/screenshots (${shots.length} imagens)`);
})();
