/* Conteúdo: fases, minidesafios, artigos, projetos, itens e conquistas.
   Pega erros de digitação antes de chegarem ao jogador (resposta fora das opções, id repetido...). */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadScripts, CORE } = require('../helpers/load');

const g = loadScripts(CORE, ['PHASES', 'MAPS', 'LIBRARY', 'TRACKS', 'MINI_BANK', 'PROJECTS', 'COSMETICS', 'PALETTES', 'ACHIEVEMENTS']);
const unique = (list, label) => {
  const seen = new Set();
  for (const id of list) {
    assert.ok(!seen.has(id), `${label} repetido: ${id}`);
    seen.add(id);
  }
};
const CHALLENGE_TYPES = ['dragdrop', 'css', 'js', 'terminal', 'file'];

describe('fases', () => {
  for (const [id, ph] of Object.entries(g.PHASES)) {
    test(`${id}: estrutura completa`, () => {
      assert.equal(ph.id, id);
      for (const k of ['name', 'tag', 'color', 'obstacleName', 'obstacleIntro', 'success']) assert.ok(ph[k], `falta ${k}`);
      assert.match(ph.color, /^#[0-9a-f]{6}$/i);
      assert.ok(ph.mentor && ph.mentor.name && ph.mentor.emoji, 'mentor incompleto');
      assert.ok(ph.dialogue.length >= 3, 'diálogo curto demais para ensinar o conceito');
      assert.ok(ph.reward.xp > 0 && ph.reward.item.id && ph.reward.item.name && ph.reward.item.emoji, 'recompensa incompleta');
    });
    test(`${id}: desafio válido`, () => {
      let ch = ph.challenge;
      while (ch) {
        assert.ok(CHALLENGE_TYPES.includes(ch.type), `tipo desconhecido: ${ch.type}`);
        if (ch.type === 'dragdrop')
          for (const v of Object.values(ch.answer)) assert.ok(ch.palette.includes(v), `resposta "${v}" não está na paleta`);
        if (ch.type === 'js') {
          assert.ok(ch.fnName && ch.tests.length >= 2);
          assert.ok(
            ch.tests.some(t => t.expect === true) && ch.tests.some(t => t.expect === false),
            'testes devem cobrir o caso certo e o errado',
          );
        }
        if (ch.type === 'file') assert.ok(ch.rules.length >= 2 && ch.rules.every(r => r.label && r.hint && typeof r.test === 'function'));
        if (ch.type === 'terminal') assert.ok(ch.images.length && (ch.goal || ch.check), 'terminal sem objetivo');
        if (ch.type !== 'terminal' && ch.type !== 'css') assert.ok(ch.hints, 'desafio sem dicas');
        ch = ch.next;
      }
    });
  }
  test('itens de recompensa não se repetem', () =>
    unique(
      Object.values(g.PHASES).map(p => p.reward.item.id),
      'item',
    ));
});

describe('minidesafios', () => {
  test('pelo menos 6 por trilha', () => {
    for (const tr of ['HTML', 'CSS', 'JavaScript', 'Docker']) assert.ok(g.MINI_BANK.filter(q => q.track === tr).length >= 6, tr);
  });
  g.MINI_BANK.forEach((q, i) => {
    test(`#${i} (${q.track}/${q.t}): resposta coerente`, () => {
      assert.ok(q.q && q.why, 'falta pergunta ou explicação');
      if (q.t === 'quiz') {
        assert.ok(q.opts.length >= 2);
        assert.ok(q.a >= 0 && q.a < q.opts.length, 'índice da resposta fora das opções');
        unique(q.opts, 'opção');
      } else if (q.t === 'bug') assert.ok(q.a >= 0 && q.a < q.lines.length, 'linha do bug fora do código');
      else if (q.t === 'order') {
        assert.ok(q.lines.length >= 3);
        unique(q.lines, 'linha');
      } else if (q.t === 'fill') {
        assert.equal(q.code.split('____').length, 2, 'precisa de exatamente uma lacuna ____');
        assert.ok(
          q.a.length && q.a.every(a => a === a.toLowerCase() && !/\s/.test(a)),
          'respostas devem estar em minúsculas e sem espaços',
        );
      } else assert.fail(`formato desconhecido: ${q.t}`);
    });
  });
});

describe('biblioteca', () => {
  test('ids únicos, trilha conhecida, nível 1 a 3 e texto com conteúdo', () => {
    unique(
      g.LIBRARY.map(a => a.id),
      'artigo',
    );
    for (const a of g.LIBRARY) {
      assert.ok(g.TRACKS.includes(a.track), `${a.id}: trilha ${a.track}`);
      assert.ok([1, 2, 3].includes(a.level), `${a.id}: nível ${a.level}`);
      assert.ok(a.body.length > 300, `${a.id}: artigo curto demais`);
      assert.equal((a.body.match(/```/g) || []).length % 2, 0, `${a.id}: bloco de código sem fechar`);
    }
  });
});

describe('projetos reais', () => {
  test('ids únicos e todos com requisitos verificáveis', () => {
    unique(
      g.PROJECTS.map(p => p.id),
      'projeto',
    );
    for (const p of g.PROJECTS) {
      assert.ok(p.coins > 0 && p.title && p.desc, p.id);
      const reqs = p.reqs || p.files.flatMap(f => f.rules);
      assert.ok(reqs.length >= 3, `${p.id}: poucos requisitos`);
      for (const r of reqs)
        assert.ok(r.label && (typeof r.check === 'function' || typeof r.test === 'function'), `${p.id}: requisito sem verificação`);
    }
  });
});

describe('loja e conquistas', () => {
  test('itens da loja: ids únicos por categoria, preço válido e fase de desbloqueio existente', () => {
    for (const [cat, items] of Object.entries(g.COSMETICS)) {
      unique(
        items.map(i => i.id),
        `item de ${cat}`,
      );
      assert.ok(
        items.some(i => i.price === 0 && !i.req),
        `${cat}: precisa de uma opção grátis`,
      );
      for (const i of items) {
        assert.ok(i.price >= 0);
        if (i.req) assert.ok(g.PHASES[i.req], `${i.id}: fase ${i.req} não existe`);
      }
    }
  });
  test('paletas só com cores hexadecimais', () => {
    for (const cores of Object.values(g.PALETTES)) for (const c of cores) assert.match(c, /^#[0-9a-f]{6}$/i);
  });
  test('conquistas: ids únicos, recompensa e teste', () => {
    unique(
      g.ACHIEVEMENTS.map(a => a.id),
      'conquista',
    );
    for (const a of g.ACHIEVEMENTS) assert.ok(a.icon && a.name && a.desc && a.coins > 0 && typeof a.test === 'function', a.id);
  });
});
