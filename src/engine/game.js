/* =====================================================================
   CodeRealm — loop do jogo
   Herói, partículas, movimento no grid, interação (NPC, obstáculo, baú,
   portais e quiosques), recompensas, HUD, loop de animação e boot.
   ===================================================================== */

const MOVE_MS = 150;

// ---------- Herói e mascote ----------
const hasSave = load();
Rewards.migrate();
let player = makeCharacter(state.look),
  pet = makePet(state.look.pet);
scene.add(player);
if (pet) scene.add(pet);
const DIR_ROT = { down: 0, up: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 };
const DIR_VEC = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
// Chamado quando o jogador troca roupa, cabelo, chapéu ou mascote
function rebuildPlayer() {
  const pos = player.position.clone(),
    rot = player.rotation.y;
  scene.remove(player);
  player = makeCharacter(state.look);
  player.position.copy(pos);
  player.rotation.y = rot;
  scene.add(player);
  if (pet) scene.remove(pet);
  pet = makePet(state.look.pet);
  if (pet) {
    pet.position.copy(pos);
    scene.add(pet);
  }
  needsFrame = true;
}

// ---------- Partículas ----------
const PN = 220,
  pGeo = new THREE.BufferGeometry(),
  pPos = new Float32Array(PN * 3),
  pVel = [];
for (let i = 0; i < PN; i++) {
  pPos[i * 3] = (Math.random() - 0.5) * 22;
  pPos[i * 3 + 1] = Math.random() * 5;
  pPos[i * 3 + 2] = (Math.random() - 0.5) * 16;
  pVel.push(0.2 + Math.random() * 0.5);
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pMat = new THREE.PointsMaterial({ color: 0xf5d27a, size: 0.09, transparent: true, opacity: 0.8, depthWrite: false });
const ambient = new THREE.Points(pGeo, pMat);
ambient.frustumCulled = false;
scene.add(ambient);
let burst = null;
function spawnBurst(x, z, color, n = 160, power = 1) {
  if (settings.reducedMotion) n = Math.min(n, 24);
  if (burst) {
    scene.remove(burst.points);
    burst.points.geometry.dispose();
  }
  const geo = new THREE.BufferGeometry(),
    pos = new Float32Array(n * 3),
    vel = [];
  for (let i = 0; i < n; i++) {
    pos[i * 3] = x;
    pos[i * 3 + 1] = 0.5;
    pos[i * 3 + 2] = z;
    const a = Math.random() * 6.28,
      s = (1 + Math.random() * 3) * power;
    vel.push([Math.cos(a) * s, (2 + Math.random() * 3) * power, Math.sin(a) * s]);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.16, transparent: true, opacity: 1, depthWrite: false }));
  points.frustumCulled = false;
  scene.add(points);
  burst = { points, vel, life: 0 };
}
// Poeirinha nos pés ao andar
const DN = 30,
  dGeo = new THREE.BufferGeometry(),
  dPos = new Float32Array(DN * 3).fill(-10),
  dLife = new Float32Array(DN).fill(9);
let dNext = 0;
dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
const dust = new THREE.Points(
  dGeo,
  new THREE.PointsMaterial({ color: 0xe8dcc0, size: 0.12, transparent: true, opacity: 0.55, depthWrite: false }),
);
dust.frustumCulled = false;
scene.add(dust);
function spawnDust(x, z) {
  for (let k = 0; k < 3; k++) {
    const i = dNext++ % DN;
    dPos[i * 3] = x + (Math.random() - 0.5) * 0.3;
    dPos[i * 3 + 1] = 0.05;
    dPos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.3;
    dLife[i] = 0;
  }
}

// ---------- Movimento e interação ----------
const keys = {};
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k.startsWith('arrow') && state.inGame && !state.locked) e.preventDefault();
  if (k === 'e') pressInteract();
});
addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});
addEventListener('blur', () => clearKeys()); // trocar de aba não deixa o herói andando sozinho
function clearKeys() {
  for (const k in keys) keys[k] = false;
}
// Tecla E (ou botão de toque): interage com o que está na frente do herói
function pressInteract() {
  if (!state.inGame || state.locked || state.player.moving) return;
  const [dx, dy] = DIR_VEC[state.player.dir],
    x = state.player.x + dx,
    y = state.player.y + dy;
  if (!interact(isBlocked(x, y), x, y)) UI.toast('Nada para interagir aqui. Fique de frente para algo e aperte E.');
}

// Encostar (ou apertar E de frente) em algo interativo
function interact(b, x, y) {
  if (b === 'npc') {
    clearKeys();
    UI.openDialogue(npcId());
    return true;
  }
  if (b === 'obstacle') {
    clearKeys();
    UI.openObstacle(map().phase);
    return true;
  }
  if (b === 'chest') {
    clearKeys();
    openChest();
    return true;
  }
  if (b === 'prop') {
    clearKeys();
    useProp(propAt(x, y));
    return true;
  }
  if (b === 'locked') {
    const p = portalAt(x, y),
      i = PHASE_ORDER.indexOf(p.to);
    UI.toast(`🔒 Conclua ${MAP_NAMES[PHASE_ORDER[i - 1]]} para abrir este portal.`);
    return true;
  }
  return false;
}
// Quiosques da Academia
function useProp(p) {
  if (!p) return;
  if (p.kind === 'exam') return Exam.open();
  if (p.kind === 'board') return Mini.daily();
  if (p.kind === 'shop') return Hub.open('character');
  if (p.kind === 'library') return Hub.open('library');
  if (p.kind === 'arena') return Hub.open('arena');
  if (p.kind === 'fountain') return UI.toast('A Fonte do Código. Dizem que quem programa todo dia nunca volta a ter medo de erro.');
}
function openChest() {
  const name = state.map,
    ph = PHASES[map().phase];
  if (state.chests[name]) {
    UI.toast('Baú vazio. Você já pegou o tesouro daqui.');
    return;
  }
  Mini.play({
    track: ph.tag,
    count: 1,
    title: 'Baú do ' + MAP_NAMES[name],
    intro: 'O baú tem uma tranca de código. Acerte o desafio para abrir.',
    reward: '+25 moedas',
    onWin: () => {
      state.chests[name] = true;
      Sfx.chest();
      Rewards.addCoins(25, 'Baú aberto');
      spawnBurst(wx(map().chest.x), wz(map().chest.y), 0xf5c542, 60, 0.6);
      Rewards.check();
      save();
    },
  });
}

function tryMove() {
  if (!state.inGame || state.locked || state.player.moving) return;
  let dx = 0,
    dy = 0,
    dir = state.player.dir;
  if (keys['w'] || keys['arrowup']) {
    dy = -1;
    dir = 'up';
  } else if (keys['s'] || keys['arrowdown']) {
    dy = 1;
    dir = 'down';
  } else if (keys['a'] || keys['arrowleft']) {
    dx = -1;
    dir = 'left';
  } else if (keys['d'] || keys['arrowright']) {
    dx = 1;
    dir = 'right';
  }
  if (!dx && !dy) return;
  state.player.dir = dir;
  $('hint').classList.add('gone');
  const nx = state.player.x + dx,
    ny = state.player.y + dy,
    b = isBlocked(nx, ny);
  if (interact(b, nx, ny) || b) return;
  state.player.moving = true;
  Sfx.step();
  spawnDust(wx(state.player.x), wz(state.player.y));
  const sx = state.player.px,
    sy = state.player.py,
    start = performance.now();
  (function step(now) {
    const k = Math.min(1, (now - start) / MOVE_MS);
    state.player.px = sx + dx * k;
    state.player.py = sy + dy * k;
    if (k < 1) requestAnimationFrame(step);
    else {
      state.player.x = nx;
      state.player.y = ny;
      state.player.moving = false;
      onArrive();
    }
  })(start);
}
function onArrive() {
  const m = map(),
    p = state.player;
  const ci = world.coins.findIndex(c => c.userData.x === p.x && c.userData.y === p.y);
  if (ci >= 0) {
    // pegou uma moeda
    const c = world.coins.splice(ci, 1)[0];
    world.group.remove(c);
    (state.picked[state.map] = state.picked[state.map] || []).push(c.userData.i);
    state.stats.coinsPicked++;
    Sfx.coin();
    spawnBurst(c.position.x, c.position.z, 0xf5c542, 24, 0.5);
    Rewards.addCoins(5);
    Rewards.check();
  }
  const portal = portalAt(p.x, p.y);
  if (portal) {
    clearKeys();
    state.replay = null;
    changeMap(portal.to);
    return;
  }
  if (m.exit && p.x === m.exit.x && p.y === m.exit.y) {
    clearKeys();
    if (state.replay) {
      UI.toast('Fase repetida concluída!');
      state.replay = null;
      changeMap('academia');
    } else if (m.next) changeMap(m.next);
    return;
  }
  save();
}
function changeMap(name) {
  Sfx.portal();
  state.locked = true;
  $('fade').classList.add('on');
  setTimeout(() => {
    state.map = name;
    const s = MAPS[name].spawn;
    Object.assign(state.player, { x: s.x, y: s.y, px: s.x, py: s.y, dir: name === 'academia' ? 'up' : 'right' });
    (state.stats.visited = state.stats.visited || {})[name] = true;
    dissolve = state.solved[MAPS[name].phase] ? 1 : 0;
    buildWorld();
    save();
    saveBackup();
    Rewards.check();
    $('fade').classList.remove('on');
    UI.setHint(name);
    setTimeout(() => {
      state.locked = false;
    }, 450);
  }, 480);
}
// Repetir uma fase já concluída (sem XP novo; dá para melhorar as estrelas)
function replayPhase(id) {
  state.replay = id;
  state.solved[id] = false;
  changeMap(id);
}

// ---------- Recompensa ----------
function solvePhase(id, stars = 1) {
  state.solved[id] = true;
  const ph = PHASES[id],
    o = map().obstacle,
    c = o.cells[Math.floor(o.cells.length / 2)];
  spawnBurst(wx(c.x), wz(c.y), parseInt(ph.color.slice(1), 16));
  const start = performance.now();
  (function anim(now) {
    dissolve = Math.min(1, (now - start) / 1000);
    if (dissolve < 1) requestAnimationFrame(anim);
    else {
      state.locked = false;
      save();
    }
  })(start);
  const first = !state.done[id];
  if (first) {
    state.done[id] = true;
    gainXp(ph.reward.xp);
    if (!state.inventory.includes(ph.reward.item.id)) state.inventory.push(ph.reward.item.id);
  }
  Rewards.onPhase(id, stars);
  renderHud();
  save();
  saveBackup();
}
function gainXp(n) {
  state.xp += n;
  while (state.xp >= state.level * 150) {
    state.xp -= state.level * 150;
    state.level++;
  }
}
function renderHud() {
  $('hud-name').textContent = state.name;
  $('hud-level').textContent = `Nv. ${state.level}`;
  $('hud-xp-fill').style.width = `${(state.xp / (state.level * 150)) * 100}%`;
  $('hud-xp').setAttribute('aria-valuenow', Math.round((state.xp / (state.level * 150)) * 100));
  $('hud-coins').textContent = state.coins;
  document.querySelectorAll('.coin-count').forEach(e => {
    e.textContent = state.coins;
  });
  const inv = $('hud-inventory');
  inv.innerHTML = '';
  Object.values(PHASES).forEach(ph => {
    const s = document.createElement('span');
    const has = state.inventory.includes(ph.reward.item.id);
    s.className = 'slot' + (has ? ' filled' : ' empty');
    s.textContent = has ? ph.reward.item.emoji : '?';
    s.title = has ? ph.reward.item.name : '???';
    inv.appendChild(s);
  });
}

// ---------- Loop ----------
let last = performance.now(),
  frame = 0;
const perf = { n: 0, t: 0, low: false },
  MODAL = $('modal-backdrop'),
  _v = new THREE.Vector3();
function loop(now) {
  requestAnimationFrame(loop);
  if (!renderer) return;
  const raw = (now - last) / 1000,
    dt = Math.min(0.05, raw);
  last = now;
  frame++;
  Touch.update();
  // Menu aberto: o mundo fica congelado (desenha só quando algo mudou). Economiza bateria e GPU.
  if (!state.inGame) {
    if (needsFrame) {
      renderer.render(scene, camera);
      needsFrame = false;
    }
    return;
  }
  t += dt;
  state.stats.seconds += dt;
  // Qualidade automática: abaixo de 24 fps nos primeiros segundos, cai para "baixa".
  if (settings.quality === 'auto' && !perf.low) {
    perf.n++;
    perf.t += raw;
    if (perf.t > 3) {
      if (perf.n / perf.t < 24) {
        perf.low = true;
        applyQuality('baixa');
        UI.toast('Modo desempenho ativado (sem sombras). Ajuste em Configurações.');
      }
      perf.n = 0;
      perf.t = 0;
    }
  }
  tryMove();
  const p = state.player,
    still = settings.reducedMotion;
  player.position.set(wx(p.px), 0, wz(p.py));
  let dr = DIR_ROT[p.dir] - player.rotation.y;
  dr = Math.atan2(Math.sin(dr), Math.cos(dr));
  player.rotation.y += dr * 0.25; // gira pelo caminho mais curto
  animateCharacter(player, p.moving, t);
  if (pet) {
    const [vx, vz] = DIR_VEC[p.dir];
    pet.position.x += (player.position.x - vx * 0.9 - pet.position.x) * 0.07;
    pet.position.z += (player.position.z - vz * 0.9 - pet.position.z) * 0.07;
    pet.rotation.y = Math.atan2(player.position.x - pet.position.x, player.position.z - pet.position.z);
    animatePet(pet, t);
  }
  if (world) {
    if (!still) swayWorld(t);
    if (world.water) world.water.position.y = -0.22 + Math.sin(t * 1.5) * 0.02;
    M.lava.emissiveIntensity = 1 + Math.sin(t * 3) * 0.35;
    if (world.bubble) {
      world.bubble.visible = !state.talked[npcId()];
      world.bubble.position.y = 2.1 + Math.sin(t * 4) * 0.08;
    }
    if (world.npc) {
      world.npc.rotation.y = Math.atan2(player.position.x - world.npc.position.x, player.position.z - world.npc.position.z);
      animateCharacter(world.npc, false, t);
    }
    if (world.exit) {
      world.exit.ring.rotation.y = t * 1.5;
      world.exit.ring2.rotation.y = -t * 2;
      world.exit.ring2.position.y = 0.5 + Math.sin(t * 2) * 0.15;
      M.portal.emissiveIntensity = 0.5 + (Math.sin(t * 3) + 1) * 0.3;
      M.beam.opacity = 0.12 + (Math.sin(t * 3) + 1) * 0.05;
    }
    for (const pt of world.portals) {
      if (pt.locked) continue;
      pt.ring.rotation.y = t * 1.5;
      pt.ring2.rotation.y = -t * 2;
      pt.ring2.position.y = 0.5 + Math.sin(t * 2 + pt.phase) * 0.15;
      pt.mat.emissiveIntensity = 0.5 + (Math.sin(t * 3 + pt.phase) + 1) * 0.3;
    }
    if (world.examCrystal) {
      world.examCrystal.rotation.y = t;
      world.examCrystal.position.y = 1.45 + Math.sin(t * 2) * 0.08;
    }
    for (const c of world.coins) {
      c.rotation.y = t * 3 + c.userData.i;
      c.position.y = 0.45 + Math.sin(t * 3 + c.userData.i) * 0.06;
    }
    if (world.chest) {
      const open = !!state.chests[state.map];
      world.chest.lid.rotation.x += ((open ? -1.2 : 0) - world.chest.lid.rotation.x) * 0.1;
      world.chest.q.visible = !open;
      world.chest.q.position.y = 1.1 + Math.sin(t * 3) * 0.06;
    }
    animateObstacle();
  }
  // câmera: segue o herói e aproxima durante as conversas (desligado em "movimento reduzido")
  camZoom += ((state.talking && !still ? 0.68 : 1) - camZoom) * 0.06;
  camTarget.lerp(player.position, still ? 0.2 : 0.08);
  camera.position.copy(camTarget).add(_v.copy(CAM_OFF).multiplyScalar(camZoom * camFit));
  camera.lookAt(camTarget.x, camTarget.y + 0.5, camTarget.z);
  sun.position.copy(camTarget).add(_v.set(6, 14, 4));
  sun.target.position.copy(camTarget);
  // partículas
  ambient.visible = ambientEnabled;
  if (ambientEnabled) {
    const arr = pGeo.attributes.position.array;
    for (let i = 0; i < PN; i++) {
      arr[i * 3 + 1] += pVel[i] * dt;
      if (arr[i * 3 + 1] > 5) arr[i * 3 + 1] = 0;
    }
    pGeo.attributes.position.needsUpdate = true;
  }
  for (let i = 0; i < DN; i++) {
    if (dLife[i] > 0.5) {
      dPos[i * 3 + 1] = -10;
      continue;
    }
    dLife[i] += dt;
    dPos[i * 3 + 1] += dt * 0.6;
  }
  dGeo.attributes.position.needsUpdate = true;
  if (burst) {
    burst.life += dt;
    const a = burst.points.geometry.attributes.position.array;
    burst.vel.forEach((v, i) => {
      a[i * 3] += v[0] * dt;
      a[i * 3 + 1] += v[1] * dt;
      a[i * 3 + 2] += v[2] * dt;
      v[1] -= 6 * dt;
    });
    burst.points.geometry.attributes.position.needsUpdate = true;
    burst.points.material.opacity = Math.max(0, 1 - burst.life / 1.6);
    if (burst.life > 1.6) {
      scene.remove(burst.points);
      burst.points.geometry.dispose();
      burst = null;
    }
  }
  // Com um desafio aberto por cima, o mundo é desenhado a 1/3 da taxa
  if (!MODAL.classList.contains('hidden') && frame % 3) return;
  renderer.render(scene, camera);
}

// ---------- Boot ----------
(state.stats.visited = state.stats.visited || {})[state.map] = true;
renderHud();
buildWorld();
if (map().phase && state.solved[map().phase]) dissolve = 1;
camera.lookAt(camTarget.x, camTarget.y + 0.5, camTarget.z);
sun.position.copy(camTarget).add(_v.set(6, 14, 4));
sun.target.position.copy(camTarget);
if (world.obstacle) animateObstacle();
Touch.init();
Hub.init(hasSave);
requestAnimationFrame(loop);
window.CodeRealm = { version: APP_VERSION, state, settings }; // atalho para depurar pelo console (F12)
