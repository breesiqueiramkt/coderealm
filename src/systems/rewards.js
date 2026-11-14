/* =====================================================================
   CodeRealm — regras de premiação: moedas, estrelas, conquistas,
   sequência diária e loja. Os itens e as conquistas (dados) ficam em
   src/content/cosmetics.js e src/content/achievements.js.
   ===================================================================== */

const Rewards = (() => {
  const $ = id => document.getElementById(id);
  const dateStr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = () => dateStr(new Date());
  const starsText = n => '★'.repeat(n) + '☆'.repeat(3 - n);

  function addCoins(n, why) {
    state.coins += n;
    if (typeof renderHud === 'function') renderHud();
    const chip = $('hud-coin-chip');
    if (chip) {
      chip.classList.remove('bump');
      void chip.offsetWidth;
      chip.classList.add('bump');
    }
    if (why) UI.toast(`${why}: +${n} 🪙`);
  }

  // Estrelas de um desafio: 3 = sem erro e sem dica · 2 = até 2 erros · 1 = concluiu
  const starsFor = (errors, hints) => (errors === 0 && hints === 0 ? 3 : errors <= 2 ? 2 : 1);
  // Moedas que uma fase paga: 20 por estrela NOVA (repetir só paga se melhorar)
  const phaseCoins = (id, stars) => Math.max(0, stars - (state.stars[id] || 0)) * 20;
  function onPhase(id, stars) {
    const gain = phaseCoins(id, stars);
    if (stars > (state.stars[id] || 0)) state.stars[id] = stars;
    if (gain) addCoins(gain);
    check();
  }
  // Quem vem da v4 já tinha fases concluídas: ganham 2 estrelas e as moedas correspondentes.
  function migrate() {
    Object.keys(PHASES).forEach(id => {
      if (state.done[id] && !state.stars[id]) {
        state.stars[id] = 2;
        state.coins += 40;
      }
    });
  }

  // Sequência diária: bônus crescente até o 7º dia
  function daily() {
    const t = today();
    if (state.daily.last === t) return null;
    const y = dateStr(new Date(Date.now() - 864e5));
    state.daily.streak = state.daily.last === y ? state.daily.streak + 1 : 1;
    state.daily.last = t;
    const bonus = 10 * Math.min(state.daily.streak, 7);
    addCoins(bonus, `Dia ${state.daily.streak} seguido`);
    check();
    save();
    return { streak: state.daily.streak, bonus };
  }

  // Conquistas
  const queue = [];
  let showing = false;
  function check() {
    ACHIEVEMENTS.forEach(a => {
      let ok = false;
      try {
        ok = !!a.test();
      } catch (_) {}
      if (ok && !state.ach[a.id]) {
        state.ach[a.id] = true;
        state.coins += a.coins;
        queue.push(a);
      }
    });
    if (typeof renderHud === 'function') renderHud();
    if (queue.length) {
      save();
      pump();
    }
  }
  function pump() {
    if (showing || !queue.length) return;
    showing = true;
    const a = queue.shift(),
      el = $('ach-pop');
    if (!el) {
      showing = false;
      queue.length = 0;
      return;
    } // sem tela (ex.: testes): só registra
    el.innerHTML = `<span class="ach-icon">${a.icon}</span><div><small>Conquista desbloqueada</small><b>${a.name}</b><span>+${a.coins} 🪙</span></div>`;
    el.classList.add('show');
    Sfx.win();
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => {
        showing = false;
        pump();
      }, 350);
    }, 2600);
  }

  // Loja
  const key = (cat, id) => cat + ':' + id;
  function owns(cat, item) {
    if (item.req) return !!state.done[item.req];
    return item.price === 0 || !!state.owned[key(cat, item.id)];
  }
  function buy(cat, item) {
    if (owns(cat, item)) return true;
    if (item.req || state.coins < item.price) return false;
    state.coins -= item.price;
    state.owned[key(cat, item.id)] = true;
    Sfx.coin();
    renderHud();
    check();
    save();
    return true;
  }

  return { addCoins, starsFor, starsText, phaseCoins, onPhase, migrate, daily, today, check, owns, buy };
})();
