/* Testes de ponta a ponta: abrem o jogo de verdade num Chromium sem janela (Playwright)
   e jogam como uma pessoa jogaria: teclado, cliques, terminal, editor.
   Rodar: npm run test:e2e   (na primeira vez: npx playwright install chromium) */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createServer } = require('../../scripts/serve');

// WebGL por software: funciona em qualquer máquina e no GitHub Actions
const GL_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
let server, base, browser;

before(async () => {
  server = createServer().listen(0);
  base = `http://localhost:${server.address().port}/?nosw`; // ?nosw: sem service worker nos testes
  browser = await chromium.launch({ args: GL_ARGS });
});
after(async () => {
  await browser.close();
  server.close();
});

// Abre o jogo num perfil limpo e coleta qualquer erro de JavaScript
async function open({ fast = true, context = {} } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 720 }, ...context });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => {
    if (m.type() === 'error' && !/fonts|ERR_/.test(m.text())) errors.push(m.text());
  });
  await page.goto(base);
  await page.waitForFunction(() => window.CodeRealm && document.querySelector('#btn-play'));
  // fast: desliga o desenho 3D (só a lógica importa aqui) para os testes rodarem rápido
  if (fast)
    await page.evaluate(() => {
      if (renderer) renderer.render = () => {};
      settings.textSpeed = 'instantanea';
    });
  return { page, errors, close: () => ctx.close() };
}
const step = async (page, key) => {
  await page.keyboard.down(key);
  await page.waitForTimeout(110);
  await page.keyboard.up(key);
  await page.waitForFunction(() => !state.player.moving);
  await page.waitForTimeout(60);
};
const teleport = (page, x, y, dir = 'up') =>
  page.evaluate(([x, y, dir]) => Object.assign(state.player, { x, y, px: x, py: y, dir }), [x, y, dir]);
const talkThrough = async page => {
  while (await page.isVisible('#dialog')) {
    await page.click('#dialog-next');
    await page.waitForTimeout(30);
  }
};
const startGame = async page => {
  await page.click('#btn-play');
  if (await page.isVisible('#tutorial')) await page.click('#tut-ok');
};

describe('CodeRealm (navegador)', () => {
  test('abre sem erros, com menu, versão e 3D funcionando', async () => {
    const { page, errors, close } = await open({ fast: false });
    assert.equal(await page.evaluate(() => HAS_WEBGL), true);
    assert.match(await page.textContent('.app-version'), /^v\d+\.\d+\.\d+$/);
    for (const tab of ['phases', 'library', 'arena', 'character', 'achievements', 'profile', 'settings']) {
      await page.click(`[data-tab="${tab}"]`);
      assert.ok(await page.isVisible(`#page-${tab}`), `página ${tab}`);
    }
    assert.deepEqual(errors, []);
    await close();
  });

  test('jogo novo: tutorial, Academia, Reitora, portal trancado e portal da fase 1', async () => {
    const { page, errors, close } = await open();
    await page.click('#btn-play');
    assert.ok(await page.isVisible('#tutorial'), 'tutorial na primeira vez');
    await page.click('#tut-ok');
    assert.equal(await page.evaluate(() => state.map), 'academia');
    await step(page, 'w');
    await step(page, 'd'); // encosta na Reitora
    assert.match(await page.textContent('#dialog-name'), /Reitora Byte/);
    await talkThrough(page);
    assert.match(await page.textContent('#hint'), /Próximo portal: 1/);
    await teleport(page, 4, 4);
    await step(page, 'w');
    assert.match(await page.textContent('#toast'), /Conclua Vale das Tags/);
    await teleport(page, 2, 4);
    await step(page, 'w');
    await page.waitForFunction(() => state.map === 'vale' && !state.locked);
    await step(page, 'w');
    await step(page, 'a'); // portal ⌂ de volta
    await page.waitForFunction(() => state.map === 'academia' && !state.locked);
    assert.deepEqual(errors, []);
    await close();
  });

  test('fase 1 (HTML) concluída de primeira vale 3 estrelas, XP, item e moedas', async () => {
    const { page, errors, close } = await open();
    await startGame(page);
    await page.evaluate(() => {
      state.talked.vale = true;
      changeMap('vale');
    });
    await page.waitForFunction(() => state.map === 'vale' && !state.locked);
    await teleport(page, 8, 7, 'right');
    await step(page, 'd');
    assert.ok(await page.isVisible('#modal'), 'desafio abriu ao encostar na ponte');
    for (const [slot, tag] of Object.entries({ s1: 'html', s2: 'head', s3: 'body', s4: 'header', s5: 'main', s6: 'footer' })) {
      await page.click(`.chip:text-is("${tag}")`);
      await page.click(`[data-slot="${slot}"]`);
    }
    await page.click('#dd-test');
    await page.waitForSelector('#btn-reward');
    assert.equal(await page.locator('.star.on').count(), 3);
    await page.click('#btn-reward');
    const s = await page.evaluate(() => ({
      done: state.done.vale,
      stars: state.stars.vale,
      xp: state.level > 1 || state.xp > 0,
      inv: state.inventory.slice(),
      coins: state.coins,
    }));
    assert.equal(s.done, true);
    assert.equal(s.stars, 3);
    assert.ok(s.xp);
    assert.ok(s.inv.includes('manto-semantica-html'));
    assert.ok(s.coins >= 60);
    assert.deepEqual(errors, []);
    await close();
  });

  test('fase 4 (Docker): terminal resolve o desafio', async () => {
    const { page, errors, close } = await open();
    await startGame(page);
    await page.evaluate(() => {
      ['vale', 'rio', 'portao'].forEach(p => {
        state.done[p] = true;
      });
      state.talked.forja = true;
      changeMap('forja');
    });
    await page.waitForFunction(() => state.map === 'forja' && !state.locked);
    await page.evaluate(() => UI.openObstacle('forja'));
    const type = async cmd => {
      await page.fill('#modal #term-in', cmd);
      await page.press('#modal #term-in', 'Enter');
    };
    await type('docker images');
    assert.match(await page.textContent('#modal .term-out'), /REPOSITORY/);
    await type('docker run -d goblin:v1'); // sem nome: ainda não resolve
    assert.match(await page.textContent('#modal #term-fb'), /goblin-cage/);
    await type('docker run -d --name goblin-cage goblin:v1');
    await page.waitForSelector('#btn-reward');
    await page.click('#btn-reward');
    assert.equal(await page.evaluate(() => state.done.forja), true);
    assert.deepEqual(errors, []);
    await close();
  });

  test('projeto real "Contador" é verificado na página renderizada', async () => {
    const { page, errors, close } = await open();
    await page.click('[data-tab="arena"]');
    await page.click('.practice-card.project:has-text("Contador") .btn');
    await page.click('#proj-verify');
    await page.waitForFunction(() => document.querySelector('#proj-fb').textContent.length > 0);
    assert.match(await page.getAttribute('#proj-fb', 'class'), /bad/, 'código inicial não pode passar');
    await page.fill(
      '#pg-js',
      `const v = document.getElementById("valor"); let n = 0;
const up = () => { v.textContent = n; v.classList.toggle("negativo", n < 0); };
document.getElementById("mais").addEventListener("click", () => { n++; up(); });
document.getElementById("menos").addEventListener("click", () => { n--; up(); });`,
    );
    await page.click('#proj-verify');
    await page.waitForFunction(() => /completo/.test(document.querySelector('#proj-fb').textContent));
    assert.equal(await page.evaluate(() => !!state.projects.contador), true);
    assert.deepEqual(errors, []);
    await close();
  });

  test('configurações e progresso sobrevivem ao recarregar a página', async () => {
    const { page, errors, close } = await open();
    await page.click('[data-tab="settings"]');
    await page.selectOption('[data-set="quality"]', 'baixa');
    await page.check('[data-set="reducedMotion"]');
    await page.click('[data-tab="profile"]');
    await page.fill('#pf-name', 'Breno');
    await page.reload();
    await page.waitForFunction(() => window.CodeRealm);
    const after = await page.evaluate(() => ({
      q: settings.quality,
      rm: settings.reducedMotion,
      name: state.name,
      shadows: renderer.shadowMap.enabled,
    }));
    assert.deepEqual(after, { q: 'baixa', rm: true, name: 'Breno', shadows: false });
    assert.deepEqual(errors, []);
    await close();
  });

  test('Exame Final: aprovado gera certificado PNG', async () => {
    const { page, errors, close } = await open();
    await startGame(page);
    await page.evaluate(() => {
      Object.keys(PHASES).forEach(p => {
        state.done[p] = true;
        state.stars[p] = 3;
      });
      state.name = 'Breno';
      Exam.open();
    });
    for (let i = 0; i < 10; i++) {
      // responde certo consultando o banco de perguntas
      await page.evaluate(() => {
        const q = MINI_BANK.find(x => x.q === document.querySelector('.mini-q').textContent),
          area = document.getElementById('mini-area');
        if (q.t === 'quiz') area.querySelectorAll('.mini-opt')[q.a].click();
        else if (q.t === 'bug') area.querySelectorAll('.mini-line')[q.a].click();
        else if (q.t === 'fill') {
          area.querySelector('#mini-in').value = q.a[0];
          area.querySelector('#mini-check').click();
        } else {
          area.querySelector('#mini-check').click();
        } // ordem: pode errar, tudo bem (precisa de 7/10)
      });
      await page.click('#mini-next');
    }
    await page.click('#mini-end');
    await page.waitForSelector('#cert-canvas');
    const exam = await page.evaluate(() => state.exam);
    assert.ok(exam.score >= 7 && /^CR-/.test(exam.code));
    const png = await page.evaluate(() => document.getElementById('cert-canvas').toDataURL('image/png').length);
    assert.ok(png > 20000, 'certificado desenhado');
    assert.deepEqual(errors, []);
    await close();
  });

  test('celular: controles de toque aparecem e andam com o herói', async () => {
    const { page, errors, close } = await open({ context: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } });
    await startGame(page);
    await page.waitForSelector('#touch.show');
    const before = await page.evaluate(() => state.player.y);
    await page.dispatchEvent('#touch .up', 'pointerdown');
    await page.waitForTimeout(120);
    await page.dispatchEvent('#touch .up', 'pointerup');
    await page.waitForFunction(() => !state.player.moving);
    assert.equal(await page.evaluate(() => state.player.y), before - 1);
    assert.deepEqual(errors, []);
    await close();
  });

  test('jornada completa: as 8 fases resolvidas pela interface, com as soluções do gabarito', async () => {
    const { page, errors, close } = await open();
    await startGame(page);
    const term = async cmds => {
      for (const c of cmds) {
        await page.fill('#modal #term-in', c);
        await page.press('#modal #term-in', 'Enter');
      }
    };
    const SOLVE = {
      vale: async () => {
        for (const [slot, tag] of Object.entries({ s1: 'html', s2: 'head', s3: 'body', s4: 'header', s5: 'main', s6: 'footer' })) {
          await page.click(`.chip:text-is("${tag}")`);
          await page.click(`[data-slot="${slot}"]`);
        }
        await page.click('#dd-test');
      },
      rio: async () => {
        await page.fill(
          '#css-editor',
          '.rio { display: flex; justify-content: space-around; align-items: center; }\n.plataforma { width: 60px; height: 44px; }',
        );
        await page.waitForTimeout(500);
        await page.click('#css-test');
      },
      portao: async () => {
        await page.fill(
          '#js-editor',
          'function abrirPortao(senha) {\n  const senhaCorreta = "abracadabra";\n  if (senha === senhaCorreta) { return true; }\n  return false;\n}',
        );
        await page.click('#js-run');
      },
      forja: () => term(['docker run -d --name goblin-cage goblin:v1']),
      moldes: async () => {
        await page.fill(
          '#file-editor',
          'FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["node", "server.js"]',
        );
        await page.click('#file-run');
        await page.waitForSelector('#modal #term-in');
        await term(['docker build -t forja-api:1.0 .', 'docker run -d --name api forja-api:1.0']);
      },
      portos: () => term(['docker run -d --name farol -p 8080:80 -e FAROL_COR=azul nginx:latest']),
      cofres: () =>
        term([
          'docker volume create memorias',
          'docker run -d --name cofre -e POSTGRES_PASSWORD=segredo -v memorias:/var/lib/postgresql/data postgres:16',
          'docker stop cofre',
          'docker rm cofre',
          'docker run -d --name cofre -e POSTGRES_PASSWORD=segredo -v memorias:/var/lib/postgresql/data postgres:16',
        ]),
      orquestra: async () => {
        const v = (await page.inputValue('#file-editor'))
          .replace('@____:', '@db:')
          .replace('- ____', '- db')
          .replace('image: ____', 'image: postgres:16')
          .replace('  ____:', '  dados:');
        await page.fill('#file-editor', v);
        await page.click('#file-run');
        await page.waitForSelector('#modal #term-in');
        await term(['docker compose up -d']);
      },
    };
    for (const id of await page.evaluate(() => PHASE_ORDER.slice())) {
      await page.evaluate(id => {
        state.talked[id] = true;
        changeMap(id);
      }, id);
      await page.waitForFunction(id => state.map === id && !state.locked, id);
      await page.evaluate(id => UI.openObstacle(id), id);
      await SOLVE[id]();
      await page.waitForSelector('#btn-reward', { timeout: 10000 });
      await page.click('#btn-reward');
      await page.waitForFunction(id => state.done[id] && !state.locked, id);
    }
    const end = await page.evaluate(() => ({
      done: Object.keys(state.done).length,
      stars: Object.values(state.stars).every(s => s === 3),
      ach: Object.keys(state.ach),
    }));
    assert.equal(end.done, 8);
    assert.ok(end.stars, 'tudo de primeira = 3 estrelas em todas');
    for (const a of ['primeiro-passo', 'trio-web', 'capitao-docker', 'jornada', 'constelacao'])
      assert.ok(end.ach.includes(a), `conquista ${a}`);
    assert.deepEqual(errors, []);
    await close();
  });

  test('PWA: depois da primeira visita o jogo abre sem internet', async () => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const online = base.replace('?nosw', '');
    await page.goto(online);
    await page.waitForFunction(
      () => (navigator.serviceWorker && navigator.serviceWorker.controller !== null) || navigator.serviceWorker.ready.then(() => true),
    );
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller); // agora controlado pelo SW
    await ctx.setOffline(true);
    await page.reload();
    await page.waitForFunction(() => window.CodeRealm && document.querySelector('#btn-play'));
    assert.equal(await page.evaluate(() => typeof PHASES), 'object');
    await ctx.close();
  });

  test('sem WebGL o app não quebra: o jogo avisa e a Biblioteca funciona', async () => {
    const noGl = await chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis'] });
    const page = await noGl.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base);
    await page.waitForFunction(() => window.CodeRealm);
    assert.equal(await page.evaluate(() => HAS_WEBGL), false);
    assert.ok(await page.isVisible('#no-webgl'));
    assert.equal(await page.isDisabled('#btn-play'), true);
    await page.click('[data-tab="library"]');
    assert.ok((await page.locator('.lib-card').count()) > 10);
    assert.deepEqual(errors, []);
    await noGl.close();
  });
});
