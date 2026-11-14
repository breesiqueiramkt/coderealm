/* =====================================================================
   CodeRealm — motor dos minidesafios (baús, desafio do dia, Arena e
   Exame Final). 4 formatos: quiz, caça ao bug, ordenar linhas e completar
   a lacuna. As perguntas ficam em src/content/minis.js.
   ===================================================================== */

const Mini = (() => {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const COLORS = { HTML: '#ff8a3d', CSS: '#4f8fbf', JavaScript: '#f5c542', Docker: '#2496ed', '*': '#8b5cf6' };
  const shuffle = (a, r = Math.random) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // o = { track ('*' = todas), count, title, intro, reward, onWin(acertos), practice, random }
  function play(o) {
    const pool = shuffle(
        MINI_BANK.filter(q => o.track === '*' || q.track === o.track),
        o.random || Math.random,
      ),
      n = o.count || 1;
    let idx = 0,
      right = 0,
      answered = 0;
    UI.openModal(
      {
        tag: o.track === '*' ? 'Mix' : o.track,
        color: COLORS[o.track] || '#8b5cf6',
        title: o.title,
        intro: o.intro || '',
        practice: !!o.practice,
      },
      body => {
        const next = () => {
          if (n > 1 && answered >= n) return summary();
          const q = pool[idx++ % pool.length];
          body.innerHTML = `<div class="mini"><div class="mini-top"><span class="mini-kind">${{ quiz: 'Pergunta', bug: 'Caça ao bug', order: 'Ordenar', fill: 'Completar' }[q.t]}</span>${n > 1 ? `<span class="muted">${answered + 1} de ${n}</span>` : ''}</div><p class="mini-q">${esc(q.q)}</p><div id="mini-area"></div><div id="mini-result"></div></div>`;
          RENDER[q.t](q, document.getElementById('mini-area'), ok => result(q, ok));
        };
        const result = (q, ok) => {
          answered++;
          if (ok) {
            right++;
            if (!o.practice) state.stats.minis++;
            Sfx.ok();
          } else Sfx.bad();
          const box = document.getElementById('mini-result');
          box.innerHTML = `<div class="mini-why ${ok ? 'ok' : 'bad'}"><b>${ok ? 'Certo!' : 'Não foi dessa vez.'}</b> ${esc(q.why)}</div><button class="btn primary" id="mini-next"></button>`;
          const b = document.getElementById('mini-next');
          if (n === 1) {
            b.textContent = ok ? `Pegar recompensa${o.reward ? ' (' + o.reward + ')' : ''} →` : 'Tentar outro desafio →';
            b.onclick = ok
              ? () => {
                  UI.closeModal();
                  if (o.onWin) o.onWin(1);
                }
              : next;
          } else {
            b.textContent = answered >= n ? 'Ver resultado →' : 'Próximo →';
            b.onclick = next;
          }
          b.focus();
        };
        const summary = () => {
          Sfx.win();
          body.innerHTML = `<div class="reward"><div class="reward-item">${right === n ? '🏅' : right ? '🎯' : '📘'}</div><h3>${right} de ${n} certos</h3><p>${right === n ? 'Gabaritou!' : right ? 'Bom treino. Os erros de hoje são os acertos de amanhã.' : 'Vale reler os artigos da Biblioteca e tentar de novo.'}</p><button class="btn primary" id="mini-end">Fechar</button></div>`;
          document.getElementById('mini-end').onclick = () => {
            UI.closeModal();
            if (o.onWin) o.onWin(right);
          };
        };
        next();
      },
    );
  }

  const RENDER = {
    quiz(q, el, done) {
      el.innerHTML = (q.code ? `<pre><code>${esc(q.code)}</code></pre>` : '') + '<div class="mini-opts"></div>';
      const box = el.querySelector('.mini-opts');
      q.opts.forEach((txt, i) => {
        const b = document.createElement('button');
        b.className = 'mini-opt';
        b.textContent = txt;
        b.onclick = () => {
          lock(box);
          b.classList.add(i === q.a ? 'right' : 'wrong');
          box.children[q.a].classList.add('right');
          done(i === q.a);
        };
        box.appendChild(b);
      });
    },
    bug(q, el, done) {
      el.innerHTML = '<div class="mini-code"></div>';
      const box = el.firstChild;
      q.lines.forEach((ln, i) => {
        const b = document.createElement('button');
        b.className = 'mini-line';
        b.innerHTML = `<span class="ln">${i + 1}</span><span class="tx">${esc(ln)}</span>`;
        b.onclick = () => {
          lock(box);
          b.classList.add(i === q.a ? 'right' : 'wrong');
          box.children[q.a].classList.add('right');
          done(i === q.a);
        };
        box.appendChild(b);
      });
    },
    order(q, el, done) {
      let cur = shuffle(q.lines.map((_, i) => i));
      if (cur.every((v, i) => v === i)) cur.reverse();
      el.innerHTML = '<div class="mini-code"></div><button class="btn primary" id="mini-check">Verificar ordem</button>';
      const box = el.firstChild;
      const draw = () => {
        box.innerHTML = '';
        cur.forEach((li, pos) => {
          const row = document.createElement('div');
          row.className = 'mini-line static';
          row.innerHTML = `<span class="mv"><button data-d="-1" ${pos === 0 ? 'disabled' : ''}>▲</button><button data-d="1" ${pos === cur.length - 1 ? 'disabled' : ''}>▼</button></span><span class="tx">${esc(q.lines[li])}</span>`;
          row.querySelectorAll('button').forEach(
            b =>
              (b.onclick = () => {
                const to = pos + Number(b.dataset.d);
                [cur[pos], cur[to]] = [cur[to], cur[pos]];
                Sfx.click();
                draw();
              }),
          );
          box.appendChild(row);
        });
      };
      draw();
      el.querySelector('#mini-check').onclick = e => {
        const ok = cur.every((v, i) => q.lines[v] === q.lines[i]);
        e.target.remove();
        lock(box);
        if (!ok) {
          cur = q.lines.map((_, i) => i);
          draw();
          lock(box);
        }
        box.classList.add(ok ? 'all-right' : 'all-shown');
        done(ok);
      };
    },
    fill(q, el, done) {
      const [a, b] = q.code.split('____');
      el.innerHTML = `<div class="mini-fill"><code>${esc(a)}</code><input id="mini-in" autocomplete="off" spellcheck="false" /><code>${esc(b || '')}</code></div><button class="btn primary" id="mini-check">Verificar</button>`;
      const inp = el.querySelector('#mini-in'),
        go = () => {
          const v = inp.value.trim().toLowerCase().replace(/\s+/g, '');
          if (!v) return;
          const ok = q.a.includes(v);
          inp.disabled = true;
          inp.classList.add(ok ? 'right' : 'wrong');
          if (!ok) inp.value = q.a[0] === 'queryselector' ? 'querySelector' : q.a[0];
          el.querySelector('#mini-check').remove();
          done(ok);
        };
      inp.onkeydown = e => {
        e.stopPropagation();
        if (e.key === 'Enter') go();
      };
      inp.onkeyup = e => e.stopPropagation();
      el.querySelector('#mini-check').onclick = go;
      setTimeout(() => inp.focus(), 50);
    },
  };
  const lock = box =>
    box.querySelectorAll('button').forEach(b => {
      b.disabled = true;
    });

  // Desafio do dia: as mesmas 3 perguntas para todo mundo naquela data
  function daily(onDone) {
    const day = Rewards.today();
    let s = 0;
    for (const ch of day) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
    const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296,
      already = state.daily.done === day;
    play({
      track: '*',
      count: 3,
      random: rnd,
      practice: already,
      title: 'Desafio do dia',
      intro: already ? 'Você já fez o de hoje. Pode refazer como treino.' : '3 perguntas misturadas. Cada acerto vale 10 moedas.',
      onWin: right => {
        if (!already) {
          state.daily.done = day;
          if (right) Rewards.addCoins(right * 10, 'Desafio do dia');
          Rewards.check();
          save();
        }
        if (onDone) onDone();
      },
    });
  }

  return { play, daily };
})();
