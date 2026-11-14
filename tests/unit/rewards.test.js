/* Regras de premiação e save: estrelas, moedas, sequência diária, loja, conquistas,
   migração de saves antigos e recuperação pelo backup. */
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { loadScripts, CORE } = require('../helpers/load');

const FILES = [...CORE, 'src/systems/rewards.js'];
const NAMES = ['state', 'Rewards', 'PHASES', 'COSMETICS', 'ACHIEVEMENTS', 'save', 'saveBackup', 'load', 'SAVE_KEY', 'DEFAULT_LOOK'];
let g;
beforeEach(() => {
  g = loadScripts(FILES, NAMES);
}); // estado novo a cada teste

describe('estrelas', () => {
  test('3 sem erros e sem dicas; 2 com até 2 erros; 1 acima disso', () => {
    assert.equal(g.Rewards.starsFor(0, 0), 3);
    assert.equal(g.Rewards.starsFor(0, 1), 2, 'usar dica tira a terceira estrela');
    assert.equal(g.Rewards.starsFor(2, 0), 2);
    assert.equal(g.Rewards.starsFor(3, 0), 1);
  });
  test('moedas: 20 por estrela NOVA; repetir sem melhorar não paga', () => {
    assert.equal(g.Rewards.phaseCoins('vale', 3), 60);
    g.Rewards.onPhase('vale', 2);
    assert.equal(g.state.stars.vale, 2);
    assert.equal(g.Rewards.phaseCoins('vale', 2), 0);
    assert.equal(g.Rewards.phaseCoins('vale', 3), 20);
  });
  test('onPhase nunca rebaixa as estrelas', () => {
    g.Rewards.onPhase('rio', 3);
    g.Rewards.onPhase('rio', 1);
    assert.equal(g.state.stars.rio, 3);
  });
});

// Relógio falso: o jogo acha que "agora" é a data informada
const fakeDate = iso => {
  const Real = Date;
  return class extends Real {
    constructor(...a) {
      super(...(a.length ? a : [iso]));
    }
    static now() {
      return new Real(iso).getTime();
    }
  };
};
const onDay = iso => loadScripts(FILES, NAMES, { Date: fakeDate(iso) });

describe('sequência diária', () => {
  test('primeiro dia vale 10 moedas; no mesmo dia não paga de novo', () => {
    const h = onDay('2026-11-10T12:00:00');
    const r = h.Rewards.daily();
    assert.equal(r.streak, 1);
    assert.equal(r.bonus, 10);
    assert.equal(h.state.coins, 10);
    assert.equal(h.Rewards.daily(), null);
  });
  test('jogou ontem: a sequência aumenta e o bônus cresce', () => {
    const h = onDay('2026-11-10T12:00:00');
    h.state.daily.last = '2026-11-09';
    h.state.daily.streak = 4;
    const r = h.Rewards.daily();
    assert.equal(r.streak, 5);
    assert.equal(r.bonus, 50);
  });
  test('o bônus para de crescer no 7º dia (70 moedas)', () => {
    const h = onDay('2026-11-10T12:00:00');
    h.state.daily.last = '2026-11-09';
    h.state.daily.streak = 20;
    assert.equal(h.Rewards.daily().bonus, 70);
  });
  test('pulou um dia: a sequência recomeça', () => {
    const h = onDay('2026-11-10T12:00:00');
    h.state.daily.last = '2026-11-01';
    h.state.daily.streak = 9;
    assert.equal(h.Rewards.daily().streak, 1);
  });
});

describe('loja', () => {
  const mago = () => g.COSMETICS.hat.find(i => i.id === 'mago');
  test('sem moedas suficientes não compra', () => {
    g.state.coins = 10;
    assert.equal(g.Rewards.buy('hat', mago()), false);
    assert.equal(g.state.coins, 10);
  });
  test('com moedas compra uma vez e desconta o preço', () => {
    g.state.ach.estiloso = true; // a 1ª compra também dá uma conquista (+10); aqui medimos só o preço
    g.state.coins = 500;
    assert.equal(g.Rewards.buy('hat', mago()), true);
    assert.equal(g.state.coins, 500 - mago().price);
    assert.equal(g.Rewards.owns('hat', mago()), true);
    assert.equal(g.Rewards.buy('hat', mago()), true);
    assert.equal(g.state.coins, 500 - mago().price, 'comprar de novo não cobra');
  });
  test('item de fase não se compra: libera ao concluir a fase', () => {
    const coroa = g.COSMETICS.hat.find(i => i.req);
    g.state.coins = 9999;
    assert.equal(g.Rewards.buy('hat', coroa), false);
    g.state.done[coroa.req] = true;
    assert.equal(g.Rewards.owns('hat', coroa), true);
  });
});

describe('conquistas', () => {
  test('pagam moedas uma única vez', () => {
    g.state.done.vale = true;
    g.Rewards.check();
    const coins = g.state.coins;
    assert.ok(g.state.ach['primeiro-passo']);
    g.Rewards.check();
    assert.equal(g.state.coins, coins);
  });
});

describe('save', () => {
  test('salvar e carregar preserva o progresso', () => {
    Object.assign(g.state, { coins: 123, name: 'Breno', map: 'rio' });
    g.state.stars.vale = 3;
    g.state.look.hat = 'mago';
    g.save();
    const txt = g.sandbox.localStorage.getItem(g.SAVE_KEY);
    const h = loadScripts(FILES, NAMES, { localStorage: g.sandbox.localStorage });
    assert.equal(h.load(), true);
    assert.equal(h.state.coins, 123);
    assert.equal(h.state.name, 'Breno');
    assert.equal(h.state.map, 'rio');
    assert.equal(h.state.stars.vale, 3);
    assert.equal(h.state.look.hat, 'mago');
    assert.equal(JSON.parse(txt).schema, 6);
  });
  test('save corrompido: recupera do backup', () => {
    g.state.coins = 77;
    g.saveBackup();
    g.sandbox.localStorage.setItem(g.SAVE_KEY, '{ isto não é json');
    const h = loadScripts(FILES, NAMES, { localStorage: g.sandbox.localStorage });
    assert.equal(h.load(), true);
    assert.equal(h.state.coins, 77);
  });
  test('save antigo (v4) sem campos novos ganha os padrões', () => {
    const v4 = {
      version: 3,
      map: 'forja',
      pos: { x: 1, y: 7 },
      done: { vale: true, rio: true },
      xp: 50,
      level: 2,
      inventory: [],
      talked: {},
      solved: {},
    };
    const ls = g.sandbox.localStorage;
    ls.setItem(g.SAVE_KEY, JSON.stringify(v4));
    const h = loadScripts(FILES, NAMES, { localStorage: ls });
    assert.equal(h.load(), true);
    assert.equal(h.state.map, 'forja');
    assert.equal(h.state.look.hairStyle, h.DEFAULT_LOOK.hairStyle, 'aparência padrão');
    h.Rewards.migrate();
    assert.equal(h.state.stars.vale, 2, 'fase antiga entra com 2 estrelas');
    assert.equal(h.state.coins, 80, '40 moedas por fase antiga');
  });
  test('save de outro jogo/versão é recusado', () => {
    g.sandbox.localStorage.setItem(g.SAVE_KEY, JSON.stringify({ version: 99, map: 'vale', pos: { x: 1, y: 1 } }));
    const h = loadScripts(FILES, NAMES, { localStorage: g.sandbox.localStorage });
    assert.equal(h.load(), false);
  });
});
