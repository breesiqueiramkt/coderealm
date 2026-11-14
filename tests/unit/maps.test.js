/* Mapas: formato da grade e, principalmente, se toda fase é JOGÁVEL.
   Uma busca em largura (BFS) a partir do ponto de entrada garante que dá para chegar ao mentor,
   ao obstáculo, ao baú, às moedas, aos portais e (com o obstáculo resolvido) à saída. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadScripts, CORE } = require('../helpers/load');

const g = loadScripts(CORE, [
  'MAPS',
  'MAP_NAMES',
  'MAP_ORDER',
  'PHASE_ORDER',
  'PHASES',
  'COLS',
  'ROWS',
  'WALKABLE',
  'GUIDES',
  'state',
  'genExtras',
  'isBlocked',
  'portalAt',
  'propAt',
  'phaseUnlocked',
]);
const VALID_TILES = new Set('0123457 8'.replace(' ', '').split(''));

// Células alcançáveis a partir do spawn. openObstacle = trata o obstáculo como resolvido.
function reachable(name, { openObstacle = false } = {}) {
  const m = g.MAPS[name];
  const walk = (x, y) => {
    if (x < 0 || y < 0 || x >= g.COLS || y >= g.ROWS) return false;
    if (m.npc && m.npc.x === x && m.npc.y === y) return false;
    if (m.chest && m.chest.x === x && m.chest.y === y) return false;
    if (g.propAt(x, y, m)) return false;
    if (m.obstacle && m.obstacle.cells.some(c => c.x === x && c.y === y)) return openObstacle;
    if (g.portalAt(x, y, m)) return true;
    return g.WALKABLE.includes(Number(m.tiles[y][x]));
  };
  const seen = new Set([`${m.spawn.x},${m.spawn.y}`]),
    queue = [[m.spawn.x, m.spawn.y]];
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        k = `${nx},${ny}`;
      if (!seen.has(k) && walk(nx, ny)) {
        seen.add(k);
        queue.push([nx, ny]);
      }
    }
  }
  return seen;
}
const adjacentReachable = (set, cells) =>
  cells.some(c =>
    [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].some(([dx, dy]) => set.has(`${c.x + dx},${c.y + dy}`)),
  );

Object.keys(g.MAPS).forEach(name => g.genExtras(name));

describe('formato dos mapas', () => {
  for (const [name, m] of Object.entries(g.MAPS)) {
    test(`${name}: grade ${g.COLS}x${g.ROWS} só com tiles conhecidos`, () => {
      assert.equal(m.tiles.length, g.ROWS);
      m.tiles.forEach((row, y) => {
        assert.equal(row.length, g.COLS, `linha ${y} tem ${row.length} colunas`);
        for (const ch of row) assert.ok(VALID_TILES.has(ch), `tile desconhecido "${ch}" na linha ${y}`);
      });
    });
    test(`${name}: tem nome e ponto de entrada andável`, () => {
      assert.ok(g.MAP_NAMES[name], 'falta o nome em MAP_NAMES');
      assert.ok(g.WALKABLE.includes(Number(m.tiles[m.spawn.y][m.spawn.x])), 'spawn em tile bloqueado');
    });
    test(`${name}: portais levam a mapas que existem`, () => {
      for (const p of m.portals || []) assert.ok(g.MAPS[p.to], `portal para mapa inexistente: ${p.to}`);
      if (m.next) assert.ok(g.MAPS[m.next], `next inexistente: ${m.next}`);
    });
  }
  test('toda fase tem um mapa e vice-versa', () => {
    for (const id of Object.keys(g.PHASES)) assert.equal(g.MAPS[id] && g.MAPS[id].phase, id, `fase ${id} sem mapa`);
    for (const m of Object.values(g.MAPS)) if (m.phase) assert.ok(g.PHASES[m.phase], `mapa aponta para fase inexistente ${m.phase}`);
  });
  test('a Academia tem um portal para cada fase', () => {
    // Array.from: os arrays vêm do contexto isolado (vm); convertemos para comparar com deepEqual
    const targets = Array.from(g.MAPS.academia.portals, p => p.to).sort();
    assert.deepEqual(targets, Array.from(g.PHASE_ORDER).sort());
  });
});

describe('toda área é jogável do começo ao fim', () => {
  for (const [name, m] of Object.entries(g.MAPS)) {
    test(`${name}: mentor, baú, moedas e portais alcançáveis`, () => {
      const r = reachable(name);
      if (m.npc) assert.ok(adjacentReachable(r, [m.npc]), 'não dá para chegar ao lado do NPC');
      if (m.chest) assert.ok(adjacentReachable(r, [m.chest]), 'baú inacessível');
      for (const p of m.portals || []) assert.ok(r.has(`${p.x},${p.y}`), `portal (${p.x},${p.y}) inacessível`);
      for (const p of m.props || []) assert.ok(adjacentReachable(r, p.cells), `quiosque ${p.kind} inacessível`);
      if (m.obstacle) assert.ok(adjacentReachable(r, m.obstacle.cells), 'obstáculo inacessível');
      // moeda pode ficar depois do obstáculo: testamos com ele aberto
      const after = reachable(name, { openObstacle: true });
      for (const c of m.coins) assert.ok(after.has(`${c.x},${c.y}`), `moeda (${c.x},${c.y}) inacessível`);
    });
    if (m.obstacle) {
      test(`${name}: a saída fica fechada até resolver o desafio`, () => {
        assert.ok(!reachable(name).has(`${m.exit.x},${m.exit.y}`), 'dá para pular o desafio!');
        assert.ok(
          reachable(name, { openObstacle: true }).has(`${m.exit.x},${m.exit.y}`),
          'saída inacessível mesmo com o obstáculo resolvido',
        );
      });
    }
  }
});

describe('moedas e baús', () => {
  test('posições são determinísticas (iguais para todo mundo)', () => {
    const before = JSON.stringify(g.MAPS.vale.coins);
    delete g.MAPS.vale.coins;
    g.genExtras('vale');
    assert.equal(JSON.stringify(g.MAPS.vale.coins), before);
  });
  test('6 moedas por mapa, sem repetir célula e sem cair em portal ou quiosque', () => {
    for (const [name, m] of Object.entries(g.MAPS)) {
      assert.equal(m.coins.length, 6, name);
      assert.equal(new Set(m.coins.map(c => `${c.x},${c.y}`)).size, 6, `${name}: moeda repetida`);
      for (const c of m.coins) {
        assert.equal(g.portalAt(c.x, c.y, m), null, `${name}: moeda em portal`);
        assert.equal(g.propAt(c.x, c.y, m), null, `${name}: moeda em quiosque`);
      }
    }
  });
  test('todo mapa de fase tem baú; a Academia não', () => {
    for (const id of Object.keys(g.PHASES)) assert.ok(g.MAPS[id].chest, `${id} sem baú`);
    assert.equal(g.MAPS.academia.chest, null);
  });
});

describe('desbloqueio dos portais', () => {
  test('só o primeiro portal começa aberto', () => {
    g.state.done = {};
    g.state.map = 'academia';
    assert.equal(g.phaseUnlocked('vale'), true);
    assert.equal(g.phaseUnlocked('rio'), false);
    assert.equal(g.isBlocked(2, 3), false, 'portal 1 deveria estar livre');
    assert.equal(g.isBlocked(4, 3), 'locked', 'portal 2 deveria estar trancado');
  });
  test('concluir uma fase abre o portal seguinte', () => {
    g.state.done = { vale: true };
    assert.equal(g.isBlocked(4, 3), false);
    assert.equal(g.isBlocked(6, 3), 'locked');
  });
  test('quiosques e NPC bloqueiam a passagem e são interativos', () => {
    g.state.map = 'academia';
    assert.equal(g.isBlocked(9, 9), 'prop');
    assert.equal(g.isBlocked(11, 11), 'npc');
    assert.ok(g.GUIDES.reitora.dialogue.length >= 3);
  });
});
