/* =====================================================================
   CodeRealm — estado do jogador, save e regras do grid
   Lógica pura (sem renderização): quem pode andar onde, portais,
   quiosques, moedas e baús, desbloqueio, salvar e carregar.
   Testado em tests/unit.
   ===================================================================== */

const SAVE_KEY = 'coderealm:save:v3'; // a chave continua "v3" para não perder saves antigos
const SAVE_SCHEMA = 6;

// ---------- Estado ----------
const DEFAULT_LOOK = {
  skin: '#f4d1b5',
  hair: '#3b2a1a',
  hairStyle: 'curto',
  outfit: '#8b5cf6',
  scarf: '#f5c542',
  hat: 'nenhum',
  cape: 'nenhuma',
  pet: 'nenhum',
};
const state = {
  map: 'academia',
  player: { x: 10, y: 12, px: 10, py: 12, moving: false, dir: 'up' },
  solved: {}, // obstáculo aberto neste mapa agora (zera ao repetir)
  done: {}, // fase concluída alguma vez (XP e item só uma vez)
  talked: {},
  xp: 0,
  level: 1,
  inventory: [],
  name: 'Aprendiz',
  read: {},
  stats: { attempts: 0, seconds: 0, minis: 0, coinsPicked: 0 },
  coins: 0,
  stars: {},
  ach: {},
  owned: {},
  look: Object.assign({}, DEFAULT_LOOK),
  daily: { last: '', streak: 0, done: '' },
  picked: {},
  chests: {},
  projects: {},
  exam: null, // { score, total, date, code } quando aprovado no Exame Final
  // não salvos:
  locked: true,
  replay: null,
  inGame: false,
  talking: false,
};
let t = 0,
  dissolve = 0;
const $ = id => document.getElementById(id);

// Campos que vão para o save. Objetos são mesclados com o padrão, então saves antigos continuam funcionando.
const PERSIST = [
  'map',
  'solved',
  'done',
  'talked',
  'xp',
  'level',
  'inventory',
  'name',
  'read',
  'stats',
  'coins',
  'stars',
  'ach',
  'owned',
  'look',
  'daily',
  'picked',
  'chests',
  'projects',
  'exam',
];
function serialize() {
  const d = { version: 3, schema: SAVE_SCHEMA, savedAt: new Date().toISOString(), pos: { x: state.player.x, y: state.player.y } };
  PERSIST.forEach(k => {
    d[k] = state[k];
  });
  return JSON.stringify(d);
}
function save() {
  try {
    localStorage.setItem(SAVE_KEY, serialize());
  } catch (_) {}
}
// Cópia de segurança: gravada em marcos importantes (fase concluída, troca de mapa)
function saveBackup() {
  try {
    localStorage.setItem(SAVE_KEY + ':backup', serialize());
  } catch (_) {}
}
// Valida e aplica um save (texto JSON). Devolve true se deu certo.
function applySave(text) {
  const d = JSON.parse(text);
  if (!d || d.version !== 3 || !MAPS[d.map] || !d.pos) return false;
  PERSIST.forEach(k => {
    if (d[k] === undefined || d[k] === null) return;
    if (state[k] && typeof state[k] === 'object' && !Array.isArray(state[k])) Object.assign(state[k], d[k]);
    else state[k] = d[k];
  });
  Object.assign(state.player, { x: d.pos.x, y: d.pos.y, px: d.pos.x, py: d.pos.y });
  return true;
}
function load() {
  for (const key of [SAVE_KEY, SAVE_KEY + ':backup']) {
    try {
      const txt = localStorage.getItem(key);
      if (txt && applySave(txt)) return true;
    } catch (_) {
      /* save corrompido: tenta o backup */
    }
  }
  return false;
}

const map = () => MAPS[state.map];
const tileAt = (x, y) => {
  const r = map().tiles[y];
  return r ? Number(r[x]) : 4;
};
const inCells = (cells, x, y) => !!cells && cells.some(c => c.x === x && c.y === y);
const WALKABLE = [0, 1, 3, 5];

// ---------- Desbloqueio ----------
function phaseUnlocked(id) {
  const i = PHASE_ORDER.indexOf(id);
  return i <= 0 || !!state.done[PHASE_ORDER[i - 1]] || !!state.done[id];
}
const portalAt = (x, y, m = map()) => (m.portals || []).find(p => p.x === x && p.y === y) || null;
const propAt = (x, y, m = map()) => (m.props || []).find(p => inCells(p.cells, x, y)) || null;
const npcId = (m = map()) => (m.npc ? m.npc.id || m.phase : null);

// ---------- Moedas e baú de cada mapa (posições fixas, sorteadas por uma semente = nome do mapa) ----------
function seeded(seed) {
  let s = 7;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
function genExtras(name) {
  const m = MAPS[name];
  if (m.coins) return;
  const r = seeded(name),
    left = [],
    right = [];
  for (let y = 1; y < ROWS - 1; y++)
    for (let x = 1; x < COLS - 1; x++) {
      const v = Number(m.tiles[y][x]);
      if (!WALKABLE.includes(v) || y === 7) continue; // linha 7 é o caminho principal: fica livre
      if (m.npc && Math.abs(m.npc.x - x) + Math.abs(m.npc.y - y) <= 1) continue;
      if (inCells(m.obstacle && m.obstacle.cells, x, y)) continue;
      (x <= 8 ? left : x >= 12 ? right : []).push({ x, y });
    }
  const shuffle = a => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  // Filtra depois de embaralhar: mantém as mesmas posições dos saves antigos sempre que possível
  const free = c => !portalAt(c.x, c.y, m) && !propAt(c.x, c.y, m) && !(m.spawn.x === c.x && m.spawn.y === c.y) && !adjacentToProp(c, m);
  const L = shuffle(left).filter(free),
    R = shuffle(right).filter(free);
  m.coins = L.slice(0, 3).concat(R.slice(0, 3));
  m.chest = m.phase && L[3] ? L[3] : null;
}
// Não deixa moeda colada num quiosque (fica feio e confunde o clique)
function adjacentToProp(c, m) {
  return (m.props || []).some(p => p.cells.some(q => Math.abs(q.x - c.x) + Math.abs(q.y - c.y) === 1));
}

// O que existe na célula (x, y)? false = livre; true = parede; string = algo interativo
function isBlocked(x, y) {
  const m = map();
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
  if (m.npc && m.npc.x === x && m.npc.y === y) return 'npc';
  if (m.chest && m.chest.x === x && m.chest.y === y) return 'chest';
  if (propAt(x, y, m)) return 'prop';
  const portal = portalAt(x, y, m);
  if (portal && MAPS[portal.to] && MAPS[portal.to].phase && !phaseUnlocked(portal.to)) return 'locked';
  if (m.obstacle && inCells(m.obstacle.cells, x, y)) return state.solved[m.phase] ? false : 'obstacle';
  return !WALKABLE.includes(tileAt(x, y)) && !portal;
}
