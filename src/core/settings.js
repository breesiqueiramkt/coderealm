/* =====================================================================
   CodeRealm — configurações do jogador
   Guardadas separadas do save do jogo: zerar o progresso não apaga
   volume, qualidade gráfica e acessibilidade.
   ===================================================================== */

const SETTINGS_KEY = 'coderealm:settings';
const prefersReducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const SETTINGS_DEFAULTS = {
  music: 50, // 0..100
  sfx: 80, // 0..100
  quality: 'auto', // auto | baixa | media | alta
  reducedMotion: prefersReducedMotion,
  textSpeed: 'normal', // normal | rapida | instantanea
  touch: 'auto', // auto | sempre | nunca
  tutorialSeen: false,
};
const settings = Object.assign({}, SETTINGS_DEFAULTS);

function loadSettings() {
  try {
    Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {});
  } catch (_) {
    /* usa o padrão */
  }
  return settings;
}
function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (_) {}
}

// Milissegundos por letra no diálogo
const TEXT_SPEED_MS = { normal: 14, rapida: 5, instantanea: 0 };

// Parâmetros de renderização por nível de qualidade
const QUALITY_PRESETS = {
  baixa: { shadows: false, shadowMap: 512, pixelRatio: 1, particles: false, antialias: false },
  media: { shadows: true, shadowMap: 1024, pixelRatio: 1.25, particles: true, antialias: true },
  alta: { shadows: true, shadowMap: 2048, pixelRatio: 1.75, particles: true, antialias: true },
};

loadSettings();
