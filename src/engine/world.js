/* =====================================================================
   CodeRealm — renderização 3D (Three.js)
   Renderer, câmera, luzes, materiais, personagens, temas, construção do
   mapa com InstancedMesh e os obstáculos animados de cada fase.
   ===================================================================== */

// =====================================================================
//  THREE.JS
// =====================================================================
THREE.ColorManagement.legacyMode = false;
const W = $('world');
// Sem WebGL (PC muito antigo, aceleração desligada) o jogo 3D não roda, mas Biblioteca, Arena e Projetos continuam.
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ antialias: settings.quality !== 'baixa', alpha: false, powerPreference: 'high-performance' });
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  W.appendChild(renderer.domElement);
} catch (err) {
  renderer = null;
  console.warn('[CodeRealm] WebGL indisponível:', err.message);
}
const HAS_WEBGL = !!renderer;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
const CAM_OFF = new THREE.Vector3(0, 13.5, 10.5);
let camTarget = new THREE.Vector3(),
  camZoom = 1,
  needsFrame = true,
  camFit = 1; // camFit: ajuste de distância para telas em pé

const hemi = new THREE.HemisphereLight(0xfff1d6, 0x3a2f5c, 0.55);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe6c0, 1.15);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -14;
sun.shadow.camera.right = 14;
sun.shadow.camera.top = 14;
sun.shadow.camera.bottom = -14;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 60;
sun.shadow.bias = -0.0008;
scene.add(sun);
scene.add(sun.target);

function resize() {
  if (!renderer) return;
  const w = W.clientWidth,
    h = W.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // Tela em pé (celular): afasta a câmera para caber mais do mapa na largura
  camFit = camera.aspect < 1 ? Math.min(1.6, 1 + (1 - camera.aspect) * 0.9) : 1;
  camera.updateProjectionMatrix();
  needsFrame = true;
}
addEventListener('resize', resize);

// Aplica o nível de qualidade escolhido nas Configurações ('auto' começa em alta e cai sozinho se ficar lento)
let ambientEnabled = true;
function applyQuality(level = settings.quality) {
  if (!renderer) return;
  const q = QUALITY_PRESETS[level === 'auto' ? 'alta' : level];
  renderer.setPixelRatio(Math.min(devicePixelRatio, q.pixelRatio));
  renderer.shadowMap.enabled = q.shadows;
  sun.castShadow = q.shadows;
  if (sun.shadow.mapSize.x !== q.shadowMap) {
    sun.shadow.mapSize.set(q.shadowMap, q.shadowMap);
    if (sun.shadow.map) {
      sun.shadow.map.dispose();
      sun.shadow.map = null;
    }
  }
  ambientEnabled = q.particles && !settings.reducedMotion;
  resize();
}
applyQuality();

// ---------- Materiais / geometrias reaproveitáveis ----------
const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, metalness: 0 });
const glowMat = (c, i = 0.7) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 0.5 });
const M = {
  grassA: mat(0x4e8a48),
  grassB: mat(0x569650),
  tall: mat(0x3f7a3b),
  path: mat(0xc2a06c),
  pathF: mat(0x5a515f),
  forge: mat(0x3a3238),
  trunk: mat(0x7a5530),
  leaf: mat(0x2f6f33),
  leafL: mat(0x4e9a52),
  pine: mat(0x245a3a),
  rock: mat(0x6a6e78),
  rockL: mat(0x8a8f99),
  water: new THREE.MeshStandardMaterial({ color: 0x3f7fb8, roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.85 }),
  lava: new THREE.MeshStandardMaterial({ color: 0xe8401a, emissive: 0xff3a0b, emissiveIntensity: 0.9, roughness: 0.8 }),
  wood: mat(0xb8864f),
  woodD: mat(0x7a5530),
  skin: mat(0xf4d1b5),
  hair: mat(0x3b2a1a),
  gold: glowMat(0xf5c542, 0.35),
  coin: glowMat(0xf5c542, 0.5),
  portal: glowMat(0xf5c542, 0.6),
  purple: mat(0x8b5cf6),
  door: mat(0x4a3f6e),
  green: mat(0x6cbf4a),
  red: glowMat(0xe05a5a, 0.6),
  glass: new THREE.MeshStandardMaterial({ color: 0x7cb6dd, transparent: true, opacity: 0.3, roughness: 0.1 }),
  white: mat(0xffffff),
  dark: mat(0x1a1626),
  mushCap: mat(0xd9534f),
  pebble: mat(0x9a9aa2),
  beam: new THREE.MeshBasicMaterial({ color: 0xf5c542, transparent: true, opacity: 0.16, depthWrite: false }),
};
const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  tile: new THREE.BoxGeometry(1, 0.3, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
  cone: new THREE.ConeGeometry(0.5, 1, 8),
  sph: new THREE.SphereGeometry(0.5, 10, 8),
  plane: new THREE.PlaneGeometry(1, 1),
  flat: new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
  ring: new THREE.TorusGeometry(0.42, 0.06, 8, 24).rotateX(Math.PI / 2),
};
const mesh = (g, m, sx = 1, sy = 1, sz = 1) => {
  const o = new THREE.Mesh(g, m);
  o.scale.set(sx, sy, sz);
  o.castShadow = true;
  o.receiveShadow = true;
  return o;
};
const wx = x => x - COLS / 2 + 0.5,
  wz = y => y - ROWS / 2 + 0.5; // grid → mundo
const hash = (x, y, k = 0) => {
  const s = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453;
  return s - Math.floor(s);
}; // "aleatório" fixo por tile

// Instâncias: centenas de cópias de uma geometria desenhadas numa chamada só (o grande ganho de desempenho da v5).
const _d = new THREE.Object3D(),
  _c = new THREE.Color();
function TM(x, y, z, sx = 1, sy = 1, sz = 1, ry = 0) {
  _d.position.set(x, y, z);
  _d.rotation.set(0, ry, 0);
  _d.scale.set(sx, sy, sz);
  _d.updateMatrix();
  return _d.matrix.clone();
}
function instanced(parent, geo, material, list, cast = true, tints = null) {
  if (!list.length) return null;
  const im = new THREE.InstancedMesh(geo, material, list.length);
  list.forEach((m, i) => {
    im.setMatrixAt(i, m);
    if (tints) im.setColorAt(i, _c.setScalar(tints[i]));
  });
  im.castShadow = cast;
  im.receiveShadow = true;
  im.frustumCulled = false;
  parent.add(im);
  return im;
}

// Texto em canvas → sprite (balão "!", etiquetas)
function labelSprite(text, color = '#e05a5a', bg = '#ffffff', size = 0.7) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = bg;
  x.beginPath();
  x.moveTo(32, 8);
  x.arcTo(248, 8, 248, 120, 24);
  x.arcTo(248, 120, 8, 120, 24);
  x.arcTo(8, 120, 8, 8, 24);
  x.arcTo(8, 8, 248, 8, 24);
  x.closePath();
  x.fill();
  x.fillStyle = color;
  let fs = 72;
  x.font = `900 ${fs}px Nunito, sans-serif`;
  while (x.measureText(text).width > 216 && fs > 22) {
    fs -= 4;
    x.font = `900 ${fs}px Nunito, sans-serif`;
  }
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(text, 128, 66);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  s.scale.set(size * 2, size, 1);
  return s;
}

// ---------- Personagens (herói customizável e mentores) ----------
// look = { skin, hair, hairStyle, outfit, scarf, hat, cape }. Tudo é montado com caixas, cones e esferas.
function makeCharacter(look) {
  look = Object.assign({}, DEFAULT_LOOK, look);
  const g = new THREE.Group(),
    mSkin = mat(look.skin),
    mHair = mat(look.hair),
    mOut = mat(look.outfit),
    mScarf = mat(look.scarf),
    mShoe = M.dark;
  const add = (o, x, y, z, parent = g) => {
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };
  const limb = (x, y, len, w, m, endMat) => {
    const p = new THREE.Group();
    p.position.set(x, y, 0);
    add(mesh(G.box, m, w, len, w + 0.03), 0, -len / 2, 0, p);
    add(mesh(G.box, endMat, w + 0.02, 0.1, w + 0.08), 0, -len - 0.03, 0.02, p);
    g.add(p);
    return p;
  };
  const legL = limb(-0.13, 0.34, 0.26, 0.17, mat(0x2d2545), mShoe),
    legR = limb(0.13, 0.34, 0.26, 0.17, mat(0x2d2545), mShoe);
  const body = add(mesh(G.box, mOut, 0.5, 0.48, 0.32), 0, 0.58, 0);
  const armL = limb(-0.32, 0.8, 0.36, 0.13, mOut, mSkin),
    armR = limb(0.32, 0.8, 0.36, 0.13, mOut, mSkin);
  const head = new THREE.Group();
  head.position.set(0, 1.04, 0);
  g.add(head);
  add(mesh(G.box, mSkin, 0.44, 0.4, 0.4), 0, 0, 0, head);
  add(mesh(G.box, M.dark, 0.06, 0.07, 0.02), -0.1, 0.02, 0.205, head);
  add(mesh(G.box, M.dark, 0.06, 0.07, 0.02), 0.1, 0.02, 0.205, head);
  add(mesh(G.box, mat(0xe8a39a), 0.07, 0.04, 0.02), -0.16, -0.07, 0.205, head);
  add(mesh(G.box, mat(0xe8a39a), 0.07, 0.04, 0.02), 0.16, -0.07, 0.205, head);
  // cabelo
  const hs = look.hairStyle;
  if (hs !== 'careca') {
    add(mesh(G.box, mHair, 0.48, 0.14, 0.44), 0, 0.22, 0, head);
    add(mesh(G.box, mHair, 0.48, 0.2, 0.1), 0, 0.1, -0.19, head);
    if (hs === 'longo') {
      add(mesh(G.box, mHair, 0.5, 0.5, 0.1), 0, -0.12, -0.2, head);
      add(mesh(G.box, mHair, 0.08, 0.36, 0.3), -0.24, -0.02, -0.06, head);
      add(mesh(G.box, mHair, 0.08, 0.36, 0.3), 0.24, -0.02, -0.06, head);
    }
    if (hs === 'espetado')
      for (let i = 0; i < 4; i++) {
        const s = add(mesh(G.cone, mHair, 0.16, 0.26, 0.16), -0.16 + i * 0.11, 0.38, i % 2 ? 0.06 : -0.06, head);
        s.rotation.z = (i - 1.5) * -0.18;
      }
    if (hs === 'coque') add(mesh(G.sph, mHair, 0.24, 0.24, 0.24), 0, 0.36, -0.1, head);
  }
  // chapéu
  if (look.hat === 'mago') {
    const c = add(mesh(G.cone, mat(0x5a3fb0), 0.5, 0.6, 0.5), 0, 0.58, 0, head);
    c.rotation.z = -0.08;
    add(mesh(G.cyl, mat(0x5a3fb0), 0.72, 0.05, 0.72), 0, 0.3, 0, head);
    add(mesh(G.cyl, M.gold, 0.46, 0.07, 0.46), 0, 0.35, 0, head);
  }
  if (look.hat === 'bone') {
    add(mesh(G.box, mScarf, 0.5, 0.14, 0.46), 0, 0.28, 0, head);
    add(mesh(G.box, mScarf, 0.4, 0.04, 0.24), 0, 0.23, 0.3, head);
  }
  if (look.hat === 'fones') {
    add(mesh(G.box, M.dark, 0.52, 0.05, 0.08), 0, 0.31, 0, head);
    add(mesh(G.box, M.dark, 0.08, 0.2, 0.16), -0.26, 0, 0, head);
    add(mesh(G.box, M.dark, 0.08, 0.2, 0.16), 0.26, 0, 0, head);
    add(mesh(G.box, glowMat(0x4ade80, 1), 0.03, 0.06, 0.06), -0.31, 0, 0, head);
  }
  if (look.hat === 'coroa') {
    add(mesh(G.cyl, M.gold, 0.46, 0.12, 0.46), 0, 0.34, 0, head);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * 6.283;
      add(mesh(G.cone, M.gold, 0.1, 0.16, 0.1), Math.cos(a) * 0.19, 0.46, Math.sin(a) * 0.19, head);
    }
    add(mesh(G.sph, glowMat(0xe05a5a, 0.8), 0.08, 0.08, 0.08), 0, 0.36, 0.23, head);
  }
  // cachecol e capa
  add(mesh(G.box, mScarf, 0.54, 0.1, 0.38), 0, 0.82, 0);
  let cape = null;
  if (look.cape === 'capa') {
    cape = new THREE.Group();
    cape.position.set(0, 0.84, -0.18);
    add(mesh(G.box, mScarf, 0.5, 0.7, 0.04), 0, -0.35, 0, cape);
    g.add(cape);
  }
  g.userData = { legL, legR, armL, armR, body, head, cape, phase: Math.random() * 6 };
  return g;
}
function animateCharacter(ch, moving, tt) {
  const u = ch.userData,
    sw = moving ? Math.sin(tt * 18) * 0.7 : 0,
    idle = Math.sin(tt * 2 + u.phase);
  u.legL.rotation.x = sw;
  u.legR.rotation.x = -sw;
  u.armL.rotation.x = -sw * 0.8 + idle * 0.04;
  u.armR.rotation.x = sw * 0.8 - idle * 0.04;
  u.armL.rotation.z = -0.06;
  u.armR.rotation.z = 0.06;
  const bob = moving ? Math.abs(Math.sin(tt * 18)) * 0.04 : idle * 0.012;
  u.body.position.y = 0.58 + bob;
  u.head.position.y = 1.04 + bob * 1.3;
  u.head.rotation.z = moving ? 0 : idle * 0.02;
  if (u.cape) u.cape.rotation.x = (moving ? 0.55 : 0.12) + Math.sin(tt * (moving ? 12 : 2)) * 0.08;
}
// Mascotes que seguem o herói
function makePet(type) {
  if (!type || type === 'nenhum') return null;
  const g = new THREE.Group(),
    add = (o, x, y, z) => {
      o.position.set(x, y, z);
      g.add(o);
      return o;
    };
  if (type === 'slime') {
    add(mesh(G.sph, mat(0x6cbf4a), 0.46, 0.34, 0.46), 0, 0.17, 0);
    add(mesh(G.box, M.dark, 0.05, 0.07, 0.02), -0.08, 0.22, 0.2);
    add(mesh(G.box, M.dark, 0.05, 0.07, 0.02), 0.08, 0.22, 0.2);
  }
  if (type === 'drone') {
    add(mesh(G.box, mat(0x9fa5a8), 0.3, 0.12, 0.3), 0, 1.1, 0);
    add(mesh(G.box, glowMat(0x2496ed, 1), 0.08, 0.05, 0.02), 0, 1.1, 0.16);
    const r = add(mesh(G.box, M.dark, 0.7, 0.02, 0.06), 0, 1.19, 0);
    g.userData.rotor = r;
  }
  if (type === 'coruja') {
    add(mesh(G.sph, mat(0xc48a2a), 0.3, 0.36, 0.28), 0, 1.15, 0);
    add(mesh(G.sph, M.white, 0.11, 0.11, 0.05), -0.07, 1.22, 0.12);
    add(mesh(G.sph, M.white, 0.11, 0.11, 0.05), 0.07, 1.22, 0.12);
    add(mesh(G.box, M.dark, 0.04, 0.04, 0.02), -0.07, 1.22, 0.15);
    add(mesh(G.box, M.dark, 0.04, 0.04, 0.02), 0.07, 1.22, 0.15);
    add(mesh(G.cone, M.gold, 0.06, 0.08, 0.06), 0, 1.15, 0.15).rotation.x = Math.PI / 2;
    const wl = add(mesh(G.box, mat(0x8a5a1a), 0.05, 0.2, 0.16), -0.17, 1.13, 0),
      wr = add(mesh(G.box, mat(0x8a5a1a), 0.05, 0.2, 0.16), 0.17, 1.13, 0);
    g.userData.wings = [wl, wr];
  }
  g.userData.type = type;
  return g;
}
function animatePet(p, tt) {
  const u = p.userData;
  if (u.type === 'slime') {
    const h = Math.abs(Math.sin(tt * 5));
    p.children[0].scale.set(0.46 + (1 - h) * 0.06, 0.34 - (1 - h) * 0.08, 0.46 + (1 - h) * 0.06);
    p.position.y = h * 0.14;
  } else p.position.y = Math.sin(tt * 3) * 0.08;
  if (u.rotor) u.rotor.rotation.y = tt * 30;
  if (u.wings) {
    u.wings[0].rotation.z = Math.sin(tt * 10) * 0.5 - 0.3;
    u.wings[1].rotation.z = -Math.sin(tt * 10) * 0.5 + 0.3;
  }
}
// Aparência dos mentores (cada fase tem o seu)
const NPC_LOOKS = {
  vale: { hairStyle: 'coque', hair: '#5a3a2a' },
  rio: { hairStyle: 'careca', skin: '#b9bcc2' },
  portao: { hairStyle: 'curto', hat: 'mago', hair: '#8a5a1a' },
  forja: { hairStyle: 'curto', hair: '#2a2a2a' },
  moldes: { hairStyle: 'curto', hair: '#2a2a2a', cape: 'capa' },
  portos: { hairStyle: 'longo', hat: 'bone', hair: '#1f2a44' },
  cofres: { hairStyle: 'longo', hair: '#d8d8e0' },
  orquestra: { hairStyle: 'coque', hat: 'coroa', hair: '#3b2a1a' },
};

// ---------- Temas (paleta por mapa) ----------
const THEMES = {
  meadow: {
    bg: 0x1a1626,
    ground: mat(0x35602f),
    floorA: M.grassA,
    floorB: M.grassB,
    path: M.path,
    hemi: 0xfff1d6,
    hemiI: 0.55,
    sun: 0xffe6c0,
    decor: true,
  },
  forge: { bg: 0x2a1a1a, ground: M.forge, floorA: M.forge, floorB: M.forge, path: M.pathF, hemi: 0xffc9a8, hemiI: 0.4, sun: 0xffb080 },
  harbor: {
    bg: 0x14283c,
    ground: mat(0x2c6a9c),
    floorA: mat(0xe2cf9a),
    floorB: mat(0xd9c58c),
    path: M.wood,
    hemi: 0xe6f4ff,
    hemiI: 0.6,
    sun: 0xfff0d0,
  },
  academy: {
    bg: 0x1d1830,
    ground: mat(0x35602f),
    floorA: M.grassA,
    floorB: M.grassB,
    path: mat(0xd8cfc0),
    hemi: 0xfff1d6,
    hemiI: 0.6,
    sun: 0xffe9c8,
    decor: true,
  },
  vault: {
    bg: 0x15121f,
    ground: mat(0x24202f),
    floorA: mat(0x4a4560),
    floorB: mat(0x4a4560),
    path: mat(0x504a68),
    hemi: 0xd8ccff,
    hemiI: 0.45,
    sun: 0xcfc0ff,
  },
};

// ---------- Construção do mapa ----------
let world = null;
function disposeWorld(w) {
  w.group.traverse(o => {
    if (o.isInstancedMesh) o.dispose();
    if (o.isSprite) {
      o.material.map.dispose();
      o.material.dispose();
    }
  });
}
function buildWorld() {
  if (world) {
    scene.remove(world.group);
    disposeWorld(world);
  }
  genExtras(state.map);
  const m = map(),
    g = new THREE.Group(),
    th = THEMES[m.theme || 'meadow'];
  world = { group: g, crowns: [], blades: [], coins: [], lava: null, water: null };
  scene.fog = new THREE.Fog(th.bg, 22, 40);
  scene.background = new THREE.Color(th.bg);
  hemi.color.set(th.hemi);
  hemi.intensity = th.hemiI;
  sun.color.set(th.sun);
  const ground = mesh(G.flat, th.ground, 90, 1, 90);
  ground.position.y = -0.31;
  ground.castShadow = false;
  g.add(ground);

  // 1) Junta as matrizes de tudo que se repete...
  const L = {
      fa: [],
      fb: [],
      path: [],
      sunk: [],
      water: [],
      rock: [],
      rock2: [],
      trunk: [],
      lava: [],
      fl: [[], [], []],
      peb: [],
      stem: [],
      cap: [],
    },
    tint = { fa: [], fb: [], path: [] };
  const special = (x, y) =>
    (m.npc && m.npc.x === x && m.npc.y === y) ||
    (m.chest && m.chest.x === x && m.chest.y === y) ||
    inCells(m.coins, x, y) ||
    (m.exit && m.exit.x === x && m.exit.y === y) ||
    !!portalAt(x, y, m) ||
    !!propAt(x, y, m);
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      const v = tileAt(x, y),
        X = wx(x),
        Z = wz(y),
        h = hash(x, y);
      const isObs = m.obstacle && inCells(m.obstacle.cells, x, y);
      if (v === 2 || (isObs && ['bridge', 'platforms', 'drawbridge'].includes(m.obstacle.type))) {
        L.sunk.push(TM(X, -0.5, Z));
        L.water.push(TM(X, 0, Z));
        continue;
      }
      const key = v === 3 ? 'path' : (x + y) % 2 ? 'fa' : 'fb';
      L[key].push(TM(X, -0.15, Z));
      tint[key].push(0.92 + h * 0.14);
      if (v === 1) for (let i = 0; i < 3; i++) world.blades.push({ x: X - 0.25 + i * 0.25, z: Z + (i % 2 ? 0.2 : -0.2), ph: x + i });
      else if (v === 4) {
        const s = 0.85 + h * 0.4,
          pine = th.decor && hash(x, y, 1) > 0.72;
        L.trunk.push(TM(X, 0.45 * s, Z, 0.3, 0.9 * s, 0.3));
        if (pine)
          world.crowns.push(
            { k: 'pine', p: [X, 1.35 * s, Z], s: [1.15 * s, 1.3 * s, 1.15 * s], ph: x * 1.3 + y * 0.7 },
            { k: 'pine', p: [X, 2.0 * s, Z], s: [0.8 * s, 1.0 * s, 0.8 * s], ph: x * 1.3 + y * 0.7 },
          );
        else
          world.crowns.push(
            { k: 'leaf', p: [X, 1.25 * s, Z], s: [1.1 * s, 1.0 * s, 1.1 * s], ph: x * 1.3 + y * 0.7 },
            { k: 'leafL', p: [X - 0.25 * s, 1.75 * s, Z + 0.1], s: [0.7 * s, 0.7 * s, 0.7 * s], ph: x * 1.3 + y * 0.7 },
            { k: 'leafL', p: [X + 0.3 * s, 1.45 * s, Z - 0.15], s: [0.55 * s, 0.5 * s, 0.55 * s], ph: x * 1.3 + y * 0.7 + 1 },
          );
      } else if (v === 5)
        for (let i = 0; i < 3; i++) L.fl[(x + i) % 3].push(TM(X - 0.25 + i * 0.25, 0.1, Z + (i % 2 ? 0.25 : -0.25), 0.14, 0.14, 0.14));
      else if (v === 7) {
        L.rock.push(TM(X, 0.55, Z, 0.98, 1.1, 0.98));
        L.rock2.push(TM(X + 0.15, 1.25, Z - 0.1, 0.5, 0.3, 0.5, h));
      } else if (v === 8) {
        L.lava.push(TM(X, 0.01, Z));
        if (tileAt(x - 1, y) !== 8 && tileAt(x, y - 1) !== 8) {
          const pl = new THREE.PointLight(0xff6a2b, 1.6, 6);
          pl.position.set(X + 0.5, 1, Z + 0.5);
          g.add(pl);
        }
      } else if (v === 0 && th.decor && !special(x, y)) {
        // enfeites: cogumelos e pedrinhas
        if (h < 0.05) {
          L.stem.push(TM(X + 0.2, 0.08, Z - 0.15, 0.08, 0.16, 0.08));
          L.cap.push(TM(X + 0.2, 0.19, Z - 0.15, 0.22, 0.12, 0.22));
        } else if (h < 0.12) L.peb.push(TM(X - 0.2, 0.03, Z + 0.2, 0.18, 0.08, 0.13, h * 20));
      }
    }
  // 2) ...e cria uma malha instanciada por tipo (poucas dezenas de draw calls no mapa inteiro)
  instanced(g, G.tile, th.floorA, L.fa, false, tint.fa);
  instanced(g, G.tile, th.floorB, L.fb, false, tint.fb);
  instanced(g, G.tile, th.path, L.path, false, tint.path);
  instanced(g, G.tile, th.floorA, L.sunk, false);
  world.water = instanced(g, G.flat, M.water, L.water, false);
  if (world.water) world.water.position.y = -0.22;
  instanced(g, G.box, M.rock, L.rock);
  instanced(g, G.box, M.rockL, L.rock2);
  instanced(g, G.cyl, M.trunk, L.trunk);
  world.lava = instanced(g, G.flat, M.lava, L.lava, false);
  const fcol = [0xf472b6, 0xf5c542, 0xc4b5fd];
  L.fl.forEach((l, i) => instanced(g, G.sph, mat(fcol[i]), l, false));
  instanced(g, G.cyl, M.white, L.stem, false);
  instanced(g, G.sph, M.mushCap, L.cap, false);
  instanced(g, G.box, M.pebble, L.peb, false);
  // copas e grama balançam: guardamos a malha e atualizamos as matrizes a cada frame
  world.crownIM = {};
  ['leaf', 'leafL', 'pine'].forEach(k => {
    const list = world.crowns.filter(c => c.k === k);
    list.forEach((c, i) => {
      c.i = i;
    });
    world.crownIM[k] = list.length
      ? instanced(
          g,
          k === 'pine' ? G.cone : G.sph,
          M[k],
          list.map(() => new THREE.Matrix4()),
        )
      : null;
  });
  world.bladeIM = world.blades.length
    ? instanced(
        g,
        G.box,
        M.tall,
        world.blades.map(() => new THREE.Matrix4()),
        false,
      )
    : null;
  swayWorld(0);

  // NPC (mentor da fase ou guia da Academia)
  if (m.npc) {
    const id = npcId(m),
      ph = PHASES[id] || GUIDES[id],
      npc = makeCharacter(Object.assign({ outfit: ph.mentor.color, scarf: '#ffffff' }, NPC_LOOKS[id] || ph.look));
    npc.position.set(wx(m.npc.x), 0, wz(m.npc.y));
    g.add(npc);
    world.npc = npc;
    const b = labelSprite('!');
    b.position.set(wx(m.npc.x) + 0.4, 2.1, wz(m.npc.y));
    g.add(b);
    world.bubble = b;
  }
  // saída: anel giratório + feixe de luz
  if (m.exit) {
    const X = wx(m.exit.x),
      Z = wz(m.exit.y),
      ring = mesh(G.ring, M.portal);
    ring.position.set(X, 0.12, Z);
    ring.castShadow = false;
    g.add(ring);
    const ring2 = mesh(G.ring, M.portal, 0.6, 0.6, 0.6);
    ring2.position.set(X, 0.5, Z);
    ring2.castShadow = false;
    g.add(ring2);
    const beam = mesh(G.cyl, M.beam, 0.8, 3, 0.8);
    beam.position.set(X, 1.5, Z);
    beam.castShadow = false;
    beam.receiveShadow = false;
    g.add(beam);
    const pl = new THREE.PointLight(0xf5c542, 1.5, 4);
    pl.position.set(X, 1, Z);
    g.add(pl);
    world.exit = { ring, ring2, beam };
  }
  // portais (Academia → fases; fases → Academia)
  world.portals = (m.portals || []).map(p => buildPortal(g, p));
  // quiosques e decoração interativa
  (m.props || []).forEach(p => buildProp(g, p));
  // moedas
  const picked = state.picked[state.map] || [];
  m.coins.forEach((c, i) => {
    if (picked.includes(i)) return;
    const coin = new THREE.Group(),
      disc = mesh(G.cyl, M.coin, 0.34, 0.06, 0.34);
    disc.rotation.x = Math.PI / 2;
    disc.castShadow = false;
    coin.add(disc);
    coin.position.set(wx(c.x), 0.45, wz(c.y));
    coin.userData = { i, x: c.x, y: c.y };
    g.add(coin);
    world.coins.push(coin);
  });
  // baú
  if (m.chest) {
    const ch = new THREE.Group(),
      base = mesh(G.box, M.wood, 0.62, 0.34, 0.46);
    base.position.y = 0.17;
    const band = mesh(G.box, M.gold, 0.1, 0.36, 0.48);
    band.position.y = 0.17;
    const lid = new THREE.Group();
    lid.position.set(0, 0.34, -0.23);
    const top = mesh(G.box, M.woodD, 0.64, 0.16, 0.48);
    top.position.set(0, 0.08, 0.23);
    const lock = mesh(G.box, M.gold, 0.12, 0.12, 0.04);
    lock.position.set(0, 0.04, 0.48);
    lid.add(top, lock);
    ch.add(base, band, lid);
    ch.position.set(wx(m.chest.x), 0, wz(m.chest.y));
    g.add(ch);
    const q = labelSprite('?', '#f5c542', '#2a2440', 0.4);
    q.position.set(wx(m.chest.x), 1.1, wz(m.chest.y));
    g.add(q);
    world.chest = { group: ch, lid, q };
  }
  if (m.obstacle) buildObstacle(g, m.obstacle);
  if (state.map === 'clareira') {
    const s = labelSprite(
      `${Object.keys(PHASES).filter(p => state.done[p]).length}/${Object.keys(PHASES).length} ✓`,
      '#f5c542',
      '#2a2440',
      1.2,
    );
    s.position.set(0, 2, 0);
    g.add(s);
  }
  scene.add(g);
  player.position.set(wx(state.player.x), 0, wz(state.player.y));
  if (pet) pet.position.copy(player.position);
  camTarget.copy(player.position);
  camera.position.copy(camTarget).add(CAM_OFF);
  needsFrame = true;
}
// Portal: anel + feixe. Trancado = cinza com cadeado. Rótulo = trilha da fase de destino.
function buildPortal(g, p) {
  const X = wx(p.x),
    Z = wz(p.y),
    dest = MAPS[p.to],
    ph = dest && PHASES[p.to];
  const locked = !!(dest && dest.phase && !phaseUnlocked(p.to)),
    done = !!(ph && state.done[p.to]);
  const color = locked ? 0x5a5570 : ph ? parseInt(ph.color.slice(1), 16) : 0xf5c542;
  const m1 = glowMat(color, locked ? 0.05 : 0.6),
    ring = mesh(G.ring, m1);
  ring.position.set(X, 0.12, Z);
  ring.castShadow = false;
  g.add(ring);
  const ring2 = mesh(G.ring, m1, 0.6, 0.6, 0.6);
  ring2.position.set(X, 0.5, Z);
  ring2.castShadow = false;
  g.add(ring2);
  let beam = null;
  if (!locked) {
    beam = mesh(G.cyl, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, depthWrite: false }), 0.8, 3, 0.8);
    beam.position.set(X, 1.5, Z);
    beam.castShadow = beam.receiveShadow = false;
    g.add(beam);
  }
  const idx = PHASE_ORDER.indexOf(p.to);
  const text = p.to === 'academia' ? '⌂ Academia' : locked ? '🔒' : `${idx + 1} · ${ph ? ph.tag : MAP_NAMES[p.to]}${done ? ' ✓' : ''}`;
  // texto escuro em fundo claro (ex.: amarelo do JavaScript), claro em fundo escuro
  const bgHex = locked ? '#2a2440' : ph ? ph.color : '#4b2fa0',
    rgb = parseInt(bgHex.slice(1), 16);
  const light = ((rgb >> 16) * 299 + ((rgb >> 8) & 255) * 587 + (rgb & 255) * 114) / 1000 > 150;
  const tag = labelSprite(text, locked ? '#b9b0c9' : light ? '#1a1626' : '#ffffff', bgHex, 0.42);
  tag.position.set(X, 1.6, Z);
  g.add(tag);
  return { ring, ring2, beam, mat: m1, locked, phase: idx };
}
// Quiosques da Academia: cada um é um objeto 3D + placa com o nome
function buildProp(g, p) {
  const xs = p.cells.map(c => wx(c.x)),
    zs = p.cells.map(c => wz(c.y));
  const X = (Math.min(...xs) + Math.max(...xs)) / 2,
    Z = (Math.min(...zs) + Math.max(...zs)) / 2,
    o = new THREE.Group();
  o.position.set(X, 0, Z);
  g.add(o);
  const add = (geo, m, sx, sy, sz, x, y, z) => {
    const k = mesh(geo, m, sx, sy, sz);
    k.position.set(x, y, z);
    o.add(k);
    return k;
  };
  if (p.kind === 'exam') {
    add(G.box, M.rockL, 1.7, 0.3, 0.9, 0, 0.15, 0);
    add(G.box, M.rock, 1.2, 0.5, 0.7, 0, 0.55, 0);
    const crystal = add(G.sph, glowMat(0x8b5cf6, 0.9), 0.5, 0.9, 0.5, 0, 1.45, 0);
    crystal.userData.spin = true;
    const pl = new THREE.PointLight(0x8b5cf6, 1.4, 5);
    pl.position.set(X, 1.6, Z);
    g.add(pl);
    world.examCrystal = crystal;
  } else if (p.kind === 'fountain') {
    add(G.cyl, M.rockL, 1.9, 0.35, 1.2, 0, 0.18, 0);
    const w = add(G.cyl, M.water, 1.7, 0.05, 1.0, 0, 0.34, 0);
    w.castShadow = false;
    add(G.cyl, M.rock, 0.25, 0.9, 0.25, 0, 0.5, 0);
    add(G.sph, glowMat(0x7cb6dd, 0.5), 0.4, 0.25, 0.4, 0, 0.98, 0);
    world.fountain = w;
  } else if (p.kind === 'board') {
    add(G.box, M.woodD, 0.08, 1.2, 0.08, -0.35, 0.6, 0);
    add(G.box, M.woodD, 0.08, 1.2, 0.08, 0.35, 0.6, 0);
    add(G.box, M.wood, 0.9, 0.6, 0.06, 0, 0.95, 0);
    [
      [-0.2, 1.02, 0xf5c542],
      [0.15, 0.9, 0xe8e3d9],
      [0.05, 1.1, 0x4ade80],
    ].forEach(([x, y, c]) => add(G.box, mat(c), 0.22, 0.18, 0.02, x, y, 0.04));
  } else if (p.kind === 'shop') {
    add(G.box, M.wood, 0.9, 0.55, 0.55, 0, 0.28, 0);
    add(G.box, M.woodD, 0.06, 1.3, 0.06, -0.42, 0.65, -0.25);
    add(G.box, M.woodD, 0.06, 1.3, 0.06, 0.42, 0.65, -0.25);
    [0xe05a5a, 0xffffff, 0xe05a5a, 0xffffff].forEach((c, i) => add(G.box, mat(c), 0.24, 0.06, 0.7, -0.36 + i * 0.24, 1.3, 0));
    add(G.sph, mat(0x8b5cf6), 0.2, 0.2, 0.2, -0.2, 0.66, 0);
    add(G.cone, mat(0x5a3fb0), 0.22, 0.3, 0.22, 0.2, 0.7, 0);
  } else if (p.kind === 'library') {
    add(G.box, M.woodD, 0.9, 1.3, 0.4, 0, 0.65, 0);
    [0xe05a5a, 0x2496ed, 0xf5c542, 0x4ade80, 0x8b5cf6, 0xff8a3d].forEach((c, i) => {
      add(G.box, mat(c), 0.11, 0.32, 0.3, -0.3 + (i % 3) * 0.3 + (i > 2 ? 0.05 : 0), i < 3 ? 0.45 : 0.9, 0.06);
    });
  } else if (p.kind === 'arena') {
    add(G.cyl, M.woodD, 0.1, 1.1, 0.1, 0, 0.55, 0);
    add(G.sph, mat(0xd9c58c), 0.5, 0.6, 0.5, 0, 1.2, 0);
    add(G.box, mat(0xd9c58c), 0.9, 0.12, 0.12, 0, 1.05, 0);
    add(G.cyl, M.red, 0.3, 0.02, 0.3, 0, 1.25, 0.24).rotation.x = Math.PI / 2;
  }
  if (p.label) {
    const s = labelSprite(p.label, '#f5c542', '#2a2440', 0.42);
    s.position.set(X, p.kind === 'exam' ? 2.35 : 1.9, Z);
    g.add(s);
  }
}
// Vento: recalcula a matriz de cada copa e de cada folha de grama
function swayWorld(tt) {
  for (const c of world.crowns) {
    const im = world.crownIM[c.k],
      a = Math.sin(tt * 1.6 + c.ph);
    _d.position.set(c.p[0] + a * 0.05 * c.p[1], c.p[1], c.p[2] + Math.cos(tt * 1.1 + c.ph) * 0.03 * c.p[1]);
    _d.rotation.set(0, 0, a * 0.04);
    _d.scale.set(c.s[0], c.s[1], c.s[2]);
    _d.updateMatrix();
    im.setMatrixAt(c.i, _d.matrix);
  }
  for (const k in world.crownIM) if (world.crownIM[k]) world.crownIM[k].instanceMatrix.needsUpdate = true;
  if (world.bladeIM) {
    world.blades.forEach((b, i) => {
      _d.position.set(b.x, 0.22, b.z);
      _d.rotation.set(0, 0, Math.sin(tt * 2 + b.ph) * 0.25);
      _d.scale.set(0.08, 0.45, 0.08);
      _d.updateMatrix();
      world.bladeIM.setMatrixAt(i, _d.matrix);
    });
    world.bladeIM.instanceMatrix.needsUpdate = true;
  }
}

function buildObstacle(g, o) {
  const c0 = o.cells[0],
    X = wx(c0.x),
    Z = wz(c0.y),
    ob = { type: o.type, parts: [] };
  world.obstacle = ob;
  if (o.type === 'bridge') {
    o.cells.forEach((c, i) => {
      const broken = new THREE.Group(); // pedras quebradas
      for (let k = 0; k < 3; k++) {
        const s = mesh(G.box, M.rockL, 0.3, 0.15, 0.25);
        s.position.set(-0.3 + k * 0.3, -0.1 + (k % 2) * 0.08, (k - 1) * 0.25);
        s.rotation.set(0.3 * k, 0.5 * k, 0.2);
        broken.add(s);
      }
      const tag = labelSprite('<?>', '#ff8a3d', '#1f1a30', 0.5);
      tag.position.y = 0.7;
      broken.add(tag);
      broken.position.set(wx(c.x), 0, wz(c.y));
      g.add(broken);
      const planks = new THREE.Group(); // tábuas (aparecem ao resolver)
      for (let k = 0; k < 4; k++) {
        const p = mesh(G.box, k % 2 ? M.wood : M.woodD, 0.22, 0.08, 1);
        p.position.set(-0.36 + k * 0.24, 0, 0);
        planks.add(p);
      }
      const rail = mesh(G.box, M.woodD, 1, 0.06, 0.06);
      rail.position.set(0, 0.25, -0.45);
      const rail2 = rail.clone();
      rail2.position.z = 0.45;
      planks.add(rail, rail2);
      planks.position.set(wx(c.x), -0.1, wz(c.y));
      planks.visible = false;
      g.add(planks);
      ob.parts.push({ before: broken, after: planks, i });
    });
  } else if (o.type === 'platforms') {
    o.cells.forEach((c, i) => {
      const p = new THREE.Group();
      const b = mesh(G.box, M.wood, 0.8, 0.18, 0.8);
      b.position.y = 0.09;
      const d = mesh(G.box, M.woodD, 0.8, 0.08, 0.8);
      d.position.y = -0.04;
      p.add(b, d);
      const sx = wx(c0.x - 1) + 0.1 + i * 0.18,
        sz = wz(c0.y - 1) + 0.3 + i * 0.35;
      p.position.set(sx, 0, sz);
      p.rotation.set(0, i % 2 ? 0.5 : -0.4, i % 3 ? 0.15 : -0.15);
      p.userData = { start: new THREE.Vector3(sx, 0, sz), end: new THREE.Vector3(wx(c.x), -0.05, wz(c.y)), rot: p.rotation.clone() };
      g.add(p);
      ob.parts.push(p);
    });
  } else if (o.type === 'gate') {
    const pl = mesh(G.box, M.rock, 0.25, 1.6, 0.5);
    pl.position.set(X - 0.4, 0.8, Z);
    const pr = pl.clone();
    pr.position.x = X + 0.4;
    g.add(pl, pr);
    const top = mesh(G.box, M.rockL, 1.1, 0.2, 0.5);
    top.position.set(X, 1.65, Z);
    g.add(top);
    const dl = new THREE.Group();
    const dlm = mesh(G.box, M.door, 0.36, 1.4, 0.1);
    dlm.position.x = 0.18;
    dl.add(dlm);
    dl.position.set(X - 0.37, 0.7, Z);
    const dr = new THREE.Group();
    const drm = mesh(G.box, M.door, 0.36, 1.4, 0.1);
    drm.position.x = -0.18;
    dr.add(drm);
    dr.position.set(X + 0.37, 0.7, Z);
    g.add(dl, dr);
    const rune = labelSprite('if(?)', '#f5c542', '#1f1a30', 0.5);
    rune.position.set(X, 1.05, Z + 0.2);
    g.add(rune);
    ob.parts = [dl, dr];
    ob.rune = rune;
  } else if (o.type === 'goblin') {
    const gob = new THREE.Group();
    const body = mesh(G.box, M.green, 0.55, 0.5, 0.45);
    body.position.y = 0.35;
    const earL = mesh(G.cone, M.green, 0.15, 0.3, 0.1);
    earL.position.set(-0.35, 0.75, 0);
    earL.rotation.z = 0.8;
    const earR = earL.clone();
    earR.position.x = 0.35;
    earR.rotation.z = -0.8;
    const eyeL = mesh(G.box, M.red, 0.08, 0.08, 0.04),
      eyeR = eyeL.clone();
    eyeL.position.set(-0.13, 0.45, 0.24);
    eyeR.position.set(0.13, 0.45, 0.24);
    gob.add(body, earL, earR, eyeL, eyeR);
    gob.position.set(X, 0, Z);
    g.add(gob);
    const tag = labelSprite('BUG', '#e05a5a', '#1f1a30', 0.45);
    tag.position.y = 1.1;
    gob.add(tag);
    const cage = mesh(G.box, M.glass, 0.9, 0.9, 0.9);
    cage.position.set(X, 2.2, Z - 1.5);
    cage.visible = false;
    g.add(cage);
    const cageTag = labelSprite('goblin-cage', '#2496ed', '#ffffff', 0.5);
    cageTag.position.set(X, 2.95, Z - 1.5);
    cageTag.visible = false;
    g.add(cageTag);
    ob.parts = [gob];
    ob.cage = cage;
    ob.cageTag = cageTag;
    ob.eyes = [eyeL, eyeR];
    ob.tag = tag;
  } else buildBarrier(g, o, ob, X, Z);
}

// Obstáculos das fases 5-8: cada um define ob.anim(d, solved), chamado a cada frame.
function buildBarrier(g, o, ob, X, Z) {
  const glow = (c, i = 0.7) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 0.5 });
  const tag = (txt, x, y, z, col = '#2496ed', bg = '#1f1a30') => {
    const s = labelSprite(txt, col, bg, 0.5);
    s.position.set(x, y, z);
    g.add(s);
    return s;
  };
  const prizeOf = (child, x, y, z) => {
    const p = new THREE.Group();
    p.add(child);
    p.position.set(x, y, z);
    p.visible = false;
    g.add(p);
    return p;
  };
  const floatPrize = (p, ptag, y, d, solved) => {
    p.visible = solved;
    p.scale.setScalar(Math.max(0.001, d));
    p.rotation.y = t;
    p.position.y = y + Math.sin(t * 2) * 0.1;
    ptag.visible = solved && d >= 1;
    ptag.position.y = y + 0.75 + Math.sin(t * 2) * 0.1;
  };

  if (o.type === 'anvil') {
    // Fase 5: bigorna bloqueando → imagem própria flutuando
    const B = new THREE.Group();
    const blk = mesh(G.box, mat(0x2b2630), 0.9, 1.1, 0.9);
    blk.position.y = 0.55;
    const hot = mesh(G.box, glow(0xff5a2b, 1), 0.5, 0.08, 0.5);
    hot.position.y = 1.14;
    B.add(blk, hot);
    B.position.set(X, 0, Z);
    g.add(B);
    const lab = tag('FROM ?', X, 1.75, Z, '#ff8a3d');
    const prize = prizeOf(mesh(G.box, glow(0x2496ed), 0.5, 0.5, 0.5), X, 1.9, Z - 1),
      ptag = tag('forja-api:1.0', X, 2.65, Z - 1, '#2496ed', '#ffffff');
    ptag.visible = false;
    ob.anim = (d, solved) => {
      B.visible = d < 1;
      B.scale.y = Math.max(0.001, 1 - d);
      lab.material.opacity = 1 - d;
      floatPrize(prize, ptag, 1.9, d, solved);
    };
  } else if (o.type === 'drawbridge') {
    // Fase 6: ponte levadiça + farol
    const pivot = new THREE.Group();
    const plank = mesh(G.box, M.wood, 1, 0.1, 0.9);
    plank.position.x = 0.5;
    const edge = mesh(G.box, M.woodD, 1, 0.12, 0.1);
    edge.position.set(0.5, 0, 0.42);
    const edge2 = edge.clone();
    edge2.position.z = -0.42;
    pivot.add(plank, edge, edge2);
    pivot.position.set(X - 0.5, -0.02, Z);
    g.add(pivot);
    const lab = tag('-p ?', X, 1.9, Z, '#f5c542');
    const bx = wx(o.beacon.x),
      bz = wz(o.beacon.y),
      lampMat = glow(0x9fd8ff, 0);
    const tower = mesh(G.cyl, M.white, 0.55, 1.7, 0.55);
    tower.position.set(bx, 1.95, bz);
    const band = mesh(G.cyl, M.red, 0.58, 0.3, 0.58);
    band.position.set(bx, 2.1, bz);
    const lamp = mesh(G.sph, lampMat, 0.5, 0.5, 0.5);
    lamp.position.set(bx, 3.05, bz);
    const cap = mesh(G.cone, M.red, 0.6, 0.4, 0.6);
    cap.position.set(bx, 3.45, bz);
    g.add(tower, band, lamp, cap);
    const beam = new THREE.Group();
    const ray = mesh(G.box, new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.35 }), 6, 0.12, 0.35);
    ray.castShadow = false;
    ray.position.x = 3;
    beam.add(ray);
    beam.position.set(bx, 3.05, bz);
    beam.visible = false;
    g.add(beam);
    const light = new THREE.PointLight(0x9fd8ff, 0, 9);
    light.position.set(bx, 3.1, bz);
    g.add(light);
    const ptag = tag('8080:80', bx, 4.1, bz, '#2496ed', '#ffffff');
    ptag.visible = false;
    ob.anim = (d, solved) => {
      pivot.rotation.z = (1 - d) * 1.3;
      lab.material.opacity = 1 - d;
      lampMat.emissiveIntensity = d * 1.6;
      light.intensity = d * 2.2;
      beam.visible = solved && d > 0.5;
      beam.rotation.y = t * 1.2;
      ptag.visible = solved && d >= 1;
    };
  } else if (o.type === 'vault') {
    // Fase 7: porta de cofre + volume persistente
    const door = new THREE.Group();
    const disc = mesh(G.cyl, mat(0x8a8f99), 0.95, 0.22, 0.95);
    disc.rotation.z = Math.PI / 2;
    const hub = mesh(G.cyl, M.gold, 0.3, 0.3, 0.3);
    hub.rotation.z = Math.PI / 2;
    const bar = mesh(G.box, M.gold, 0.1, 0.7, 0.08);
    bar.position.x = -0.14;
    const bar2 = bar.clone();
    bar2.rotation.x = Math.PI / 2;
    door.add(disc, hub, bar, bar2);
    door.position.set(X, 0.6, Z);
    g.add(door);
    const lab = tag('-v ?', X, 1.75, Z, '#c4b5fd');
    const prize = prizeOf(mesh(G.cyl, glow(0x8b5cf6), 0.5, 0.6, 0.5), X, 1.9, Z - 1),
      ptag = tag('memorias', X, 2.65, Z - 1, '#8b5cf6', '#ffffff');
    ptag.visible = false;
    ob.anim = (d, solved) => {
      door.visible = d < 1;
      door.rotation.x = d * 4;
      door.position.z = Z - d * 0.8;
      door.scale.setScalar(Math.max(0.001, 1 - d * 0.9));
      lab.material.opacity = 1 - d;
      floatPrize(prize, ptag, 1.9, d, solved);
    };
  } else if (o.type === 'tower') {
    // Fase 8: pauta dourada + serviços api/db ligando juntos
    const bars = new THREE.Group();
    for (let k = 0; k < 5; k++) {
      const b = mesh(G.box, glow(0xf5c542, 0.8), 0.9, 0.04, 0.04);
      b.position.set(0, 0.25 + k * 0.22, 0);
      b.castShadow = false;
      bars.add(b);
    }
    bars.position.set(X, 0, Z);
    g.add(bars);
    const lab = tag('compose ?', X, 1.75, Z, '#f5c542');
    const apiM = glow(0x2496ed, 0.05),
      dbM = glow(0x4ade80, 0.05),
      netM = glow(0xf5c542, 0);
    const api = mesh(G.box, apiM, 0.6, 0.8, 0.6);
    api.position.set(X, 1.55, Z - 1);
    const db = mesh(G.box, dbM, 0.6, 0.8, 0.6);
    db.position.set(X, 1.55, Z + 1);
    const net = mesh(G.box, netM, 0.08, 0.08, 2);
    net.position.set(X, 2.05, Z);
    net.visible = false;
    g.add(api, db, net);
    const tA = tag('api', X, 2.5, Z - 1, '#2496ed', '#ffffff'),
      tD = tag('db', X, 2.5, Z + 1, '#1f9d55', '#ffffff');
    tA.visible = tD.visible = false;
    const l1 = new THREE.PointLight(0x2496ed, 0, 5);
    l1.position.set(X, 2.2, Z - 1);
    const l2 = new THREE.PointLight(0x4ade80, 0, 5);
    l2.position.set(X, 2.2, Z + 1);
    g.add(l1, l2);
    ob.anim = (d, solved) => {
      bars.visible = d < 1;
      bars.scale.set(1, Math.max(0.001, 1 - d), 1);
      lab.material.opacity = 1 - d;
      const p = solved ? 0.9 + Math.sin(t * 3) * 0.25 : 0;
      apiM.emissiveIntensity = 0.05 + d * p;
      dbM.emissiveIntensity = 0.05 + d * p;
      netM.emissiveIntensity = d * 1.2;
      net.visible = solved && d > 0.4;
      l1.intensity = l2.intensity = d * 1.4;
      tA.visible = tD.visible = solved && d >= 1;
    };
  }
}

// Atualiza obstáculo conforme dissolve (0..1) e solved
function animateObstacle() {
  const m = map();
  if (!world.obstacle || !m.obstacle) return;
  const ob = world.obstacle,
    solved = state.solved[m.phase],
    d = solved ? dissolve : 0,
    c0 = m.obstacle.cells[0],
    X = wx(c0.x),
    Z = wz(c0.y);
  if (ob.anim) return ob.anim(d, !!solved);
  if (ob.type === 'bridge')
    ob.parts.forEach(p => {
      p.before.visible = d < 1;
      p.before.scale.setScalar(1 - d);
      p.after.visible = d > 0;
      p.after.position.y = -0.1 + Math.min(1, d * 1.2) * 0.1;
      p.after.scale.setScalar(Math.min(1, d * 1.2));
    });
  else if (ob.type === 'platforms')
    ob.parts.forEach((p, i) => {
      const k = solved ? THREE.MathUtils.smoothstep(d, 0, 1) : 0;
      p.position.lerpVectors(p.userData.start, p.userData.end, k);
      p.rotation.set(p.userData.rot.x * (1 - k), p.userData.rot.y * (1 - k), p.userData.rot.z * (1 - k));
      p.position.y += solved ? Math.sin(t * 2 + i) * 0.03 * k : Math.sin(t * 2 + i) * 0.02;
    });
  else if (ob.type === 'gate') {
    ob.parts[0].rotation.y = -d * 1.5;
    ob.parts[1].rotation.y = d * 1.5;
    ob.rune.material.opacity = 1 - d;
    ob.rune.material.color.set(solved ? 0x4ade80 : 0xffffff);
  } else if (ob.type === 'goblin') {
    const gob = ob.parts[0];
    if (solved && d >= 1) {
      gob.position.set(X, 2.2 + Math.sin(t * 2) * 0.1 - 0.45, Z - 1.5);
      gob.scale.setScalar(0.8);
      ob.cage.visible = ob.cageTag.visible = true;
      ob.cage.position.y = 2.2 + Math.sin(t * 2) * 0.1;
      ob.cageTag.position.y = 2.95 + Math.sin(t * 2) * 0.1;
      ob.eyes.forEach(e => (e.material = M.hair));
      ob.tag.visible = false;
    } else {
      gob.position.set(X + Math.sin(t * 3) * 0.3 * (1 - d), Math.abs(Math.sin(t * 6)) * 0.3 * (1 - d) + d * 2.2, Z - d * 1.5);
      gob.rotation.y = Math.sin(t * 4) * 0.5;
    }
  }
}
