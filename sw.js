/* CodeRealm — service worker (PWA)
   Guarda o app no cache na primeira visita: depois disso o jogo abre e roda sem internet.
   Ao publicar uma versão nova, mude CACHE (o navegador baixa tudo de novo e apaga o cache antigo). */
const CACHE = 'coderealm-v6.0.0';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'favicon.ico',
  'assets/icons/favicon.svg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'vendor/three.min.js',
  'src/styles/main.css',
  'src/core/boot.js',
  'src/core/settings.js',
  'src/core/state.js',
  'src/content/phases.js',
  'src/content/maps.js',
  'src/content/library.js',
  'src/content/minis.js',
  'src/content/projects.js',
  'src/content/cosmetics.js',
  'src/content/achievements.js',
  'src/systems/audio.js',
  'src/systems/docker-sim.js',
  'src/systems/rewards.js',
  'src/systems/minigames.js',
  'src/systems/exam.js',
  'src/ui/ui.js',
  'src/ui/hub.js',
  'src/ui/touch.js',
  'src/engine/world.js',
  'src/engine/game.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('coderealm-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
// Arquivos do app: cache primeiro. Fontes do Google: rede primeiro, cache como reserva.
self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin === location.origin) {
    e.respondWith(caches.match(request, { ignoreSearch: true }).then(hit => hit || fetch(request)));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(
      fetch(request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request)),
    );
  }
});
