/* =====================================================================
   CodeRealm — primeiro script carregado (depois do Three.js)
   Versão do app e uma rede de segurança: qualquer erro inesperado vira
   um aviso discreto na tela em vez de um jogo travado sem explicação.
   ===================================================================== */

const APP_VERSION = '6.0.0';

(() => {
  let lastShown = 0;
  function showError(msg) {
    console.error('[CodeRealm]', msg);
    const now = Date.now();
    if (now - lastShown < 5000) return;
    lastShown = now;
    let bar = document.getElementById('error-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'error-bar';
      bar.setAttribute('role', 'alert');
      document.body.appendChild(bar);
    }
    bar.innerHTML = '';
    const text = document.createElement('span');
    text.textContent = 'Algo deu errado: ' + msg + '. Seu progresso está salvo.';
    const btn = document.createElement('button');
    btn.textContent = 'Fechar';
    btn.onclick = () => bar.remove();
    bar.append(text, btn);
  }
  addEventListener('error', e => showError(e.message || 'erro desconhecido'));
  addEventListener('unhandledrejection', e => showError((e.reason && e.reason.message) || String(e.reason)));
})();

// PWA: registra o service worker para funcionar offline e permitir "instalar" o jogo.
// Só funciona servido por http(s) (GitHub Pages, npm start). Aberto com duplo clique (file://) é ignorado.
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/[?&]nosw\b/.test(location.search)) {
  addEventListener('load', () =>
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('[CodeRealm] service worker:', err.message)),
  );
}
