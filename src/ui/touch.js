/* =====================================================================
   CodeRealm — controles de toque (celular e tablet)
   Um direcional e um botão de ação. Cada botão "aperta" a mesma tecla
   que o teclado usaria, então o resto do jogo não precisa saber que é
   toque.
   ===================================================================== */

const Touch = (() => {
  let root = null,
    visible = null;
  const coarse = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  const wanted = () => settings.touch === 'sempre' || (settings.touch === 'auto' && coarse());

  function init() {
    root = document.getElementById('touch');
    if (!root) return;
    root.querySelectorAll('[data-key]').forEach(btn => {
      const k = btn.dataset.key;
      const down = e => {
        e.preventDefault();
        keys[k] = true;
        btn.classList.add('on');
      };
      const up = e => {
        e.preventDefault();
        keys[k] = false;
        btn.classList.remove('on');
      };
      btn.addEventListener('pointerdown', down);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointerleave', up);
      btn.addEventListener('pointercancel', up);
    });
    const act = root.querySelector('[data-action]');
    if (act)
      act.addEventListener('pointerdown', e => {
        e.preventDefault();
        pressInteract();
      });
  }
  // Chamado a cada frame: mostra o direcional só quando o jogador pode andar
  function update() {
    if (!root) return;
    const show = wanted() && state.inGame && !state.locked;
    if (show !== visible) {
      visible = show;
      root.classList.toggle('show', show);
      if (!show) clearKeys();
    }
  }
  return { init, update };
})();
