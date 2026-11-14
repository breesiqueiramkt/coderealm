/* =====================================================================
   CodeRealm — Hub: menu inicial, mapa de fases, Biblioteca, Arena
   (playground, terminal, desafios, projetos reais), Personagem (loja),
   Conquistas e Perfil.
   ===================================================================== */

const Hub = (() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let tab = 'home';

  function init(hasSave) {
    Sfx.bind();
    document.addEventListener('pointerdown', () => Sfx.ensure(), { once: true });
    $('btn-menu').onclick = () => open('home');
    // Esc alterna: no jogo abre o menu; no menu (sem nada aberto por cima) volta para o jogo
    addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (state.inGame && !state.locked) open('home');
      else if (
        !state.inGame &&
        $('modal-backdrop').classList.contains('hidden') &&
        HAS_WEBGL &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      )
        play();
    });
    $('btn-resume').onclick = play;
    document.querySelectorAll('[data-tab]').forEach(
      b =>
        (b.onclick = () => {
          Sfx.click();
          open(b.dataset.tab);
        }),
    );
    $('btn-play').onclick = play;
    $('btn-academy').onclick = () => {
      play();
      if (state.map !== 'academia') {
        state.replay = null;
        changeMap('academia');
      }
    };
    $('btn-reset').onclick = () => {
      if (confirm('Apagar todo o progresso e começar do zero? (As configurações são mantidas.)')) {
        localStorage.removeItem(SAVE_KEY);
        localStorage.removeItem(SAVE_KEY + ':backup');
        location.reload();
      }
    };
    $('btn-play').textContent = hasSave ? 'Continuar jornada ▸' : 'Começar jornada ▸';
    $('tut-ok').onclick = () => {
      settings.tutorialSeen = true;
      saveSettings();
      $('tutorial').classList.add('hidden');
      state.locked = false;
    };
    document.querySelectorAll('.app-version').forEach(e => {
      e.textContent = 'v' + APP_VERSION;
    });
    if (!HAS_WEBGL) {
      // sem 3D: o resto do app continua útil
      $('btn-resume').hidden = true;
      $('btn-play').disabled = true;
      $('btn-play').textContent = 'Jogo 3D indisponível neste navegador';
      $('no-webgl').classList.remove('hidden');
    }
    const d = Rewards.daily();
    open('home');
    if (d) setTimeout(() => UI.toast(`🔥 Dia ${d.streak} seguido: +${d.bonus} moedas`), 400);
    Rewards.check();
  }
  function open(name) {
    tab = name;
    state.inGame = false;
    state.locked = true;
    $('hub').classList.remove('hidden');
    $('hud').classList.add('dim');
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    document.querySelectorAll('.hub-page').forEach(p => p.classList.toggle('hidden', p.id !== 'page-' + name));
    if (name === 'home') renderHome();
    if (name === 'phases') renderPhases();
    if (name === 'library') renderLibrary();
    if (name === 'arena') renderArena();
    if (name === 'profile') renderProfile();
    if (name === 'character') renderCharacter();
    if (name === 'achievements') renderAchievements();
    if (name === 'settings') renderSettings();
    const pg = $('page-' + name);
    if (pg) {
      const h = pg.querySelector('h1, h2');
      if (h && document.activeElement && document.activeElement.closest && document.activeElement.closest('.hub-nav')) {
        h.setAttribute('tabindex', '-1');
        h.focus({ preventScroll: true });
      }
    } // teclado/leitor de tela vão para o título da página
  }
  function play() {
    if (!HAS_WEBGL) return;
    Sfx.startMusic();
    $('hub').classList.add('hidden');
    $('hud').classList.remove('dim');
    state.inGame = true;
    state.locked = false;
    UI.setHint(state.map);
    if (!settings.tutorialSeen) {
      state.locked = true;
      $('tutorial').classList.remove('hidden');
      setTimeout(() => $('tut-ok').focus(), 50);
    }
  }

  // ---------------------------------------------------------- Fases
  function renderPhases() {
    const el = $('phase-grid');
    el.innerHTML = '';
    MAP_ORDER.forEach((id, i) => {
      const ph = PHASES[id],
        done = ph ? state.done[id] : Object.keys(PHASES).every(p => state.done[p]);
      const current = state.map === id,
        unlocked = i === 0 || state.done[MAP_ORDER[i - 1]] || current || done;
      const card = document.createElement('div');
      card.className = 'phase-card' + (done ? ' done' : '') + (!unlocked ? ' locked' : '') + (current ? ' current' : '');
      card.style.setProperty('--c', ph ? ph.color : '#f5c542');
      card.innerHTML = `
        <div class="phase-num">${i + 1}</div>
        <div class="phase-tag">${ph ? esc(ph.tag) : 'Final'}</div>
        <h3>${esc(MAP_NAMES[id])}</h3>
        <p>${ph ? esc(ph.obstacleName) + ' · ' + esc(ph.mentor.name) : 'Clareira de descanso'}</p>
        <div class="phase-status">${done ? `<span class="stars-sm">${Rewards.starsText(state.stars[id] || 0)}</span> concluída` : current ? '● em andamento' : unlocked ? 'disponível' : '🔒 bloqueada'}</div>
        <div class="phase-actions"></div>`;
      const acts = card.querySelector('.phase-actions');
      if (current && !done) {
        const b = btn('Continuar', 'primary');
        b.onclick = play;
        acts.appendChild(b);
      }
      if (unlocked && !done && !current && ph) {
        const b = btn('Ir para a fase', 'primary');
        b.onclick = () => {
          play();
          state.replay = null;
          changeMap(id);
        };
        acts.appendChild(b);
      }
      if (done && ph) {
        const b = btn((state.stars[id] || 0) < 3 ? 'Repetir (buscar ★★★)' : 'Repetir fase', 'primary');
        b.onclick = () => {
          play();
          replayPhase(id);
        };
        acts.appendChild(b);
        const p = btn('Treinar desafio', 'ghost');
        p.onclick = () => {
          practice(id);
        };
        acts.appendChild(p);
      }
      if (done && !ph) {
        const b = btn('Visitar', 'primary');
        b.onclick = () => {
          play();
          changeMap(id);
        };
        acts.appendChild(b);
      }
      el.appendChild(card);
    });
  }
  const btn = (txt, cls) => {
    const b = document.createElement('button');
    b.className = 'btn ' + cls;
    b.textContent = txt;
    return b;
  };
  function practice(id) {
    UI.openObstacle(id, true);
  }

  // ---------------------------------------------------------- Biblioteca
  let libFilter = 'Todos',
    libQuery = '';
  function renderLibrary() {
    const tracks = $('lib-tracks');
    tracks.innerHTML = '';
    ['Todos', ...TRACKS].forEach(tr => {
      const b = document.createElement('button');
      b.className = 'pill' + (libFilter === tr ? ' on' : '');
      b.textContent = tr;
      b.onclick = () => {
        libFilter = tr;
        renderLibrary();
      };
      tracks.appendChild(b);
    });
    $('lib-search').oninput = e => {
      libQuery = e.target.value.toLowerCase();
      renderLibrary();
    };
    const list = $('lib-list');
    list.innerHTML = '';
    const items = LIBRARY.filter(
      a =>
        (libFilter === 'Todos' || a.track === libFilter) &&
        (!libQuery || (a.title + ' ' + a.summary + ' ' + a.body).toLowerCase().includes(libQuery)),
    );
    if (!items.length) list.innerHTML = '<p class="muted">Nada encontrado.</p>';
    items.forEach(a => {
      const card = document.createElement('button');
      card.className = 'lib-card';
      card.style.setProperty('--c', trackColor(a.track));
      card.innerHTML = `<span class="lib-track">${esc(a.track)} · nível ${a.level}${state.read[a.id] ? ' · ✓ lido' : ''}</span><h4>${esc(a.title)}</h4><p>${esc(a.summary)}</p>`;
      card.onclick = () => openArticle(a);
      list.appendChild(card);
    });
    $('lib-article').classList.add('hidden');
    $('lib-list').classList.remove('hidden');
  }
  const trackColor = tr => ({ HTML: '#ff8a3d', CSS: '#4f8fbf', JavaScript: '#f5c542', Docker: '#2496ed' })[tr] || '#8b5cf6';
  function openArticle(a) {
    if (!state.read[a.id]) {
      state.read[a.id] = true;
      save();
    }
    $('lib-list').classList.add('hidden');
    const art = $('lib-article');
    art.classList.remove('hidden');
    art.innerHTML = `<button class="btn ghost small" id="lib-back">◂ Voltar</button><span class="lib-track" style="--c:${trackColor(a.track)}">${esc(a.track)} · nível ${a.level}</span><h2>${esc(a.title)}</h2><div class="md">${md(a.body)}</div>
      <div class="lib-foot"><button class="btn primary" id="lib-arena">Praticar na Arena ▸</button></div>`;
    $('lib-back').onclick = renderLibrary;
    $('lib-arena').onclick = () => {
      arenaTab = a.track === 'Docker' ? 'docker' : 'web';
      open('arena');
    };
    art.scrollTop = 0;
  }
  // markdown-lite → HTML
  function md(src) {
    const lines = src.split('\n');
    let out = '',
      inCode = false,
      inList = false,
      inTable = false;
    const inline = s =>
      esc(s)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    const closeAll = () => {
      if (inList) {
        out += '</ul>';
        inList = false;
      }
      if (inTable) {
        out += '</tbody></table>';
        inTable = false;
      }
    };
    for (const raw of lines) {
      if (raw.startsWith('```')) {
        if (inCode) {
          out += '</code></pre>';
          inCode = false;
        } else {
          closeAll();
          out += '<pre><code>';
          inCode = true;
        }
        continue;
      }
      if (inCode) {
        out += esc(raw) + '\n';
        continue;
      }
      const l = raw.trim();
      if (!l) {
        closeAll();
        continue;
      }
      if (l.startsWith('## ')) {
        closeAll();
        out += `<h3>${inline(l.slice(3))}</h3>`;
        continue;
      }
      if (l.startsWith('|')) {
        const cells = l
          .split('|')
          .slice(1, -1)
          .map(c => c.trim());
        if (cells.every(c => /^-+$/.test(c))) continue;
        if (!inTable) {
          out += `<table><thead><tr>${cells.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>`;
          inTable = true;
        } else out += `<tr>${cells.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`;
        continue;
      }
      if (/^(- |\d+\. )/.test(l)) {
        if (!inList) {
          out += '<ul>';
          inList = true;
        }
        out += `<li>${inline(l.replace(/^(- |\d+\. )/, ''))}</li>`;
        continue;
      }
      closeAll();
      out += `<p>${inline(l)}</p>`;
    }
    closeAll();
    if (inCode) out += '</code></pre>';
    return out;
  }

  // ---------------------------------------------------------- Arena
  let arenaTab = 'projects',
    arenaBuilt = false;
  function renderArena() {
    document.querySelectorAll('[data-arena]').forEach(b => {
      b.classList.toggle('on', b.dataset.arena === arenaTab);
      b.onclick = () => {
        arenaTab = b.dataset.arena;
        renderArena();
      };
    });
    document.querySelectorAll('.arena-page').forEach(p => p.classList.toggle('hidden', p.id !== 'arena-' + arenaTab));
    if (!arenaBuilt) {
      buildPlayground();
      buildFreeTerminal();
      arenaBuilt = true;
    }
    if (arenaTab === 'practice') renderPractice();
    if (arenaTab === 'projects') renderProjects();
    if (arenaTab === 'minis') renderMinis();
  }
  let pgRun = () => {},
    pgSetup = '';
  function buildPlayground() {
    const html = $('pg-html'),
      css = $('pg-css'),
      js = $('pg-js'),
      fr = $('pg-preview'),
      con = $('pg-console');
    html.value = `<h1>Olá, Arena!</h1>\n<p class="dica">Edite HTML, CSS e JS. Nada aqui é salvo.</p>\n<button id="btn">Clique</button>`;
    css.value = `body { font-family: sans-serif; padding: 20px; background: #f7f3ea; color: #222; }\n.dica { color: #8b5cf6; }\nbutton { padding: 10px 18px; border-radius: 8px; border: 0; background: #f5c542; font-weight: bold; cursor: pointer; }`;
    js.value = `const btn = document.getElementById("btn");\nlet cliques = 0;\nbtn.addEventListener("click", () => {\n  cliques++;\n  btn.textContent = "Cliques: " + cliques;\n  console.log("clicou", cliques);\n});`;
    [html, css, js].forEach(ta => {
      UI.enableTab(ta);
      ta.addEventListener('input', () => {
        clearTimeout(ta._t);
        ta._t = setTimeout(run, 350);
      });
    });
    const run = () => {
      con.innerHTML = '';
      const bridge = `<script>(function(){const send=(t,a)=>parent.postMessage({pg:1,t,a:a.map(x=>{try{return typeof x==='object'?JSON.stringify(x):String(x)}catch(e){return String(x)}})},'*');['log','error','warn'].forEach(k=>{const o=console[k];console[k]=(...a)=>{send(k,a);o.apply(console,a)}});window.onerror=(m,s,l)=>send('error',[m+' (linha '+l+')']);})();</script>`;
      fr.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><style>${css.value}</style>${bridge}${pgSetup ? '<script>' + pgSetup + '</script>' : ''}</head><body>${html.value}<script>${js.value}</script></body></html>`;
    };
    pgRun = run;
    addEventListener('message', e => {
      if (!e.data || !e.data.pg) return;
      const d = document.createElement('div');
      d.className = 'con-row ' + e.data.t;
      d.textContent = e.data.a.join(' ');
      con.appendChild(d);
      con.scrollTop = con.scrollHeight;
    });
    $('pg-run').onclick = run;
    $('pg-clear').onclick = () => {
      con.innerHTML = '';
    };
    run();
  }
  function buildFreeTerminal() {
    const fake = {
      challenge: {
        type: 'terminal',
        prompt: 'arena@coderealm:~$',
        images: ['goblin:v1', 'nginx:latest', 'postgres:16', 'node:20-alpine'],
        goal: {},
      },
    };
    UI.builders.buildTerminal(fake, $('arena-term-body'), true);
  }
  function renderPractice() {
    const el = $('practice-list');
    el.innerHTML = '';
    Object.values(PHASES).forEach(ph => {
      const card = document.createElement('div');
      card.className = 'practice-card';
      card.style.setProperty('--c', ph.color);
      card.innerHTML = `<span class="lib-track">${esc(ph.tag)}</span><h4>${esc(ph.obstacleName)}</h4><p>${esc(ph.obstacleIntro)}</p>`;
      const b = btn(state.done[ph.id] ? 'Treinar de novo' : 'Treinar (não conta)', 'primary');
      b.onclick = () => practice(ph.id);
      card.appendChild(b);
      el.appendChild(card);
    });
  }

  // ---------------------------------------------------------- Minidesafios (Arena)
  function renderMinis() {
    const el = $('mini-list');
    el.innerHTML = '';
    ['*', ...TRACKS.filter(t => MINI_BANK.some(q => q.track === t))].forEach(tr => {
      const n = tr === '*' ? MINI_BANK.length : MINI_BANK.filter(q => q.track === tr).length;
      const card = document.createElement('div');
      card.className = 'practice-card';
      card.style.setProperty('--c', tr === '*' ? '#8b5cf6' : trackColor(tr));
      card.innerHTML = `<span class="lib-track">${tr === '*' ? 'Todas as trilhas' : esc(tr)}</span><h4>${tr === '*' ? 'Mix geral' : 'Rodada de ' + esc(tr)}</h4><p>${n} desafios no banco: perguntas, caça ao bug, ordenar código e completar lacunas. 5 por rodada, sem XP.</p>`;
      const b = btn('Jogar 5', 'primary');
      b.onclick = () =>
        Mini.play({
          track: tr,
          count: 5,
          practice: true,
          title: tr === '*' ? 'Mix geral' : 'Rodada de ' + tr,
          intro: 'Treino livre: não conta, não salva.',
        });
      card.appendChild(b);
      el.appendChild(card);
    });
  }

  // ---------------------------------------------------------- Projetos reais (Arena)
  function renderProjects() {
    const el = $('project-list');
    el.innerHTML = '';
    PROJECTS.forEach(p => {
      const done = !!state.projects[p.id],
        card = document.createElement('div');
      card.className = 'practice-card project' + (done ? ' done' : '');
      card.style.setProperty('--c', trackColor(p.track));
      card.innerHTML = `<span class="lib-track">${esc(p.track)} · nível ${p.level}${done ? ' · ✓ concluído' : ''}</span><h4>${esc(p.title)}</h4><p>${esc(p.desc)}</p><div class="proj-reqs">${(p.reqs || p.files.flatMap(f => f.rules)).map(r => `<span>☐ ${esc(r.label)}</span>`).join('')}</div>`;
      const b = btn(done ? 'Abrir de novo' : `Construir (+${p.coins} 🪙)`, 'primary');
      b.onclick = () => openProject(p);
      card.appendChild(b);
      el.appendChild(card);
    });
  }
  function openProject(p) {
    if (p.kind === 'file2') return openFileProject(p);
    arenaTab = 'web';
    renderArena();
    const html = $('pg-html'),
      css = $('pg-css'),
      js = $('pg-js');
    html.value = p.starter.html;
    css.value = p.starter.css;
    js.value = p.starter.js;
    pgSetup = p.setup || '';
    pgRun();
    const bar = $('pg-project');
    bar.classList.remove('hidden');
    bar.innerHTML = `<div class="proj-head"><b>${esc(p.title)}</b><span class="muted">${esc(p.desc)}</span></div><div class="proj-checks" id="proj-checks">${p.reqs.map(r => `<div class="test"><span class="dot"></span>${esc(r.label)}</div>`).join('')}</div><div class="ide-foot"><button class="btn primary" id="proj-verify">✔ Verificar requisitos</button><button class="btn ghost" id="proj-close">Fechar projeto</button><p class="feedback" id="proj-fb"></p></div>`;
    $('proj-close').onclick = () => {
      bar.classList.add('hidden');
      pgSetup = '';
    };
    $('proj-verify').onclick = async () => {
      pgRun();
      await new Promise(r => setTimeout(r, 450));
      const fr = $('pg-preview'),
        d = fr.contentDocument,
        w = fr.contentWindow,
        rows = $('proj-checks').children,
        fb = $('proj-fb');
      let firstFail = null;
      for (let i = 0; i < p.reqs.length; i++) {
        let r;
        try {
          r = await p.reqs[i].check(d, w);
        } catch (e) {
          r = 'Erro ao testar: ' + e.message;
        }
        const ok = r === true;
        rows[i].classList.toggle('pass', ok);
        rows[i].classList.toggle('fail', !ok);
        if (!ok && !firstFail) firstFail = r;
      }
      if (firstFail) {
        fb.textContent = firstFail;
        fb.className = 'feedback bad';
        Sfx.bad();
        return;
      }
      fb.textContent = 'Projeto completo!';
      fb.className = 'feedback ok';
      Sfx.win();
      if (!state.projects[p.id]) {
        state.projects[p.id] = true;
        Rewards.addCoins(p.coins, 'Projeto ' + p.title);
        Rewards.check();
        save();
      }
    };
    bar.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function openFileProject(p) {
    let fi = 0;
    const step = () => {
      const f = p.files[fi],
        ph = {
          challenge: {
            type: 'file',
            filename: f.name,
            starter: f.starter,
            rules: f.rules,
            hints: ['Leia a checklist: cada linha diz o que falta.'],
          },
        };
      UI.openModal(
        {
          tag: p.track,
          color: trackColor(p.track),
          title: `${p.title} — ${f.name} (${fi + 1}/${p.files.length})`,
          intro: p.desc,
          practice: !!state.projects[p.id],
        },
        body => {
          UI.builders.buildFile(ph, body);
          body.querySelector('#file-run').addEventListener('click', () =>
            setTimeout(() => {
              if (body.querySelector('#file-fb').classList.contains('ok')) {
                fi++;
                if (fi < p.files.length) step();
                else finish();
              }
            }, 900),
          );
        },
      );
    };
    const finish = () => {
      UI.closeModal();
      if (!state.projects[p.id]) {
        state.projects[p.id] = true;
        Rewards.addCoins(p.coins, 'Projeto ' + p.title);
        Rewards.check();
        save();
      } else UI.toast('Projeto refeito!');
      renderProjects();
    };
    step();
  }

  // ---------------------------------------------------------- Início
  function renderHome() {
    const ids = Object.keys(PHASES),
      doneN = ids.filter(p => state.done[p]).length,
      next = MAP_ORDER.find(m => PHASES[m] && !state.done[m]);
    const box = $('home-cards');
    if (!box) return;
    box.innerHTML = `
      <button class="home-card daily ${state.daily.done === Rewards.today() ? 'done' : ''}" id="home-daily"><span>📅</span><b>Desafio do dia</b><small>${state.daily.done === Rewards.today() ? 'Feito hoje ✓ · refazer como treino' : '3 perguntas · até 30 🪙'}</small><em>🔥 ${state.daily.streak} dia(s) seguido(s)</em></button>
      <button class="home-card" id="home-next"><span>🗺️</span><b>${next ? 'Próxima fase' : 'Jornada completa'}</b><small>${next ? esc(MAP_NAMES[next]) : 'Repita fases para 3 estrelas'}</small><em>${doneN}/${ids.length} fases</em></button>
      <button class="home-card" data-tab="character"><span>🧑‍🎨</span><b>Personagem</b><small>Cabelo, roupa, chapéu, mascote</small><em>${state.coins} 🪙 disponíveis</em></button>
      <button class="home-card" data-tab="achievements"><span>🏅</span><b>Conquistas</b><small>${Object.keys(state.ach).length}/${ACHIEVEMENTS.length} desbloqueadas</small><em>${
        ACHIEVEMENTS.filter(a => !state.ach[a.id])
          .slice(0, 1)
          .map(a => 'Próxima: ' + a.name)
          .join('') || 'Todas!'
      }</em></button>`;
    $('home-daily').onclick = () => Mini.daily(renderHome);
    $('home-next').onclick = () => {
      if (next) {
        play();
        if (state.map !== next) changeMap(next);
      } else open('phases');
    };
    box.querySelectorAll('[data-tab]').forEach(
      b =>
        (b.onclick = () => {
          Sfx.click();
          open(b.dataset.tab);
        }),
    );
  }

  // ---------------------------------------------------------- Personagem (loja)
  let preview = null;
  function renderCharacter() {
    const look = state.look,
      box = $('char-opts');
    box.innerHTML = '';
    const section = (title, inner) => {
      const d = document.createElement('div');
      d.className = 'char-sec';
      d.innerHTML = `<div class="dd-label">${title}</div>`;
      d.appendChild(inner);
      box.appendChild(d);
    };
    Object.keys(PALETTES).forEach(k => {
      const row = document.createElement('div');
      row.className = 'swatches';
      PALETTES[k].forEach(c => {
        const s = document.createElement('button');
        s.className = 'swatch' + (look[k] === c ? ' on' : '');
        s.style.background = c;
        s.title = c;
        s.onclick = () => {
          look[k] = c;
          Sfx.click();
          apply();
        };
        row.appendChild(s);
      });
      section(PALETTE_LABELS[k], row);
    });
    Object.keys(COSMETICS).forEach(cat => {
      const row = document.createElement('div');
      row.className = 'shop-row';
      COSMETICS[cat].forEach(item => {
        const owned = Rewards.owns(cat, item),
          on = look[cat] === item.id,
          b = document.createElement('button');
        b.className = 'shop-item' + (on ? ' on' : '') + (owned ? '' : ' locked');
        b.innerHTML = `<b>${esc(item.name)}</b><small>${owned ? (on ? 'equipado' : 'disponível') : item.req ? '🔒 conclua ' + esc(MAP_NAMES[item.req]) : item.price + ' 🪙'}</small>`;
        b.onclick = () => {
          if (!owned) {
            if (item.req) return UI.toast(`Desbloqueia ao concluir ${MAP_NAMES[item.req]}.`);
            if (state.coins < item.price)
              return UI.toast(`Faltam ${item.price - state.coins} moedas. Pegue moedas nos mapas, baús e desafios.`);
            if (!confirm(`Comprar ${item.name} por ${item.price} moedas?`)) return;
            Rewards.buy(cat, item);
            UI.toast(`${item.name} comprado!`);
          }
          look[cat] = item.id;
          Sfx.click();
          apply();
        };
        row.appendChild(b);
      });
      section(COSMETIC_LABELS[cat], row);
    });
    const apply = () => {
      rebuildPlayer();
      save();
      Rewards.check();
      renderCharacter();
      drawPreview();
    };
    drawPreview();
  }
  // Preview do personagem numa cena Three.js própria (canvas pequeno dentro do hub)
  function drawPreview() {
    const cv = $('char-canvas');
    if (!cv) return;
    if (!preview) {
      const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
      r.setPixelRatio(Math.min(devicePixelRatio, 2));
      r.setSize(cv.clientWidth || 280, cv.clientHeight || 320, false);
      r.outputEncoding = THREE.sRGBEncoding;
      r.toneMapping = THREE.ACESFilmicToneMapping;
      const sc = new THREE.Scene(),
        cam = new THREE.PerspectiveCamera(30, (cv.clientWidth || 280) / (cv.clientHeight || 320), 0.1, 20);
      cam.position.set(0, 1.6, 4.6);
      cam.lookAt(0, 0.75, 0);
      sc.add(new THREE.HemisphereLight(0xfff1d6, 0x3a2f5c, 0.9));
      const d = new THREE.DirectionalLight(0xffe6c0, 1.2);
      d.position.set(2, 4, 3);
      sc.add(d);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 24), new THREE.MeshStandardMaterial({ color: 0x4a3f6e }));
      disc.position.y = -0.04;
      sc.add(disc);
      preview = { r, sc, cam, ch: null, pet: null, t: 0 };
      (function tick() {
        requestAnimationFrame(tick);
        if (tab !== 'character' || !preview.ch) return;
        preview.t += 0.016;
        preview.ch.rotation.y = Math.sin(preview.t * 0.6) * 0.7;
        animateCharacter(preview.ch, false, preview.t);
        if (preview.pet) {
          preview.pet.position.set(-0.75, 0, 0.45);
          preview.pet.rotation.y = 0.6;
          animatePet(preview.pet, preview.t);
        }
        preview.r.render(preview.sc, preview.cam);
      })();
    }
    if (preview.ch) preview.sc.remove(preview.ch);
    if (preview.pet) preview.sc.remove(preview.pet);
    preview.ch = makeCharacter(state.look);
    preview.sc.add(preview.ch);
    preview.pet = makePet(state.look.pet);
    if (preview.pet) preview.sc.add(preview.pet);
  }

  // ---------------------------------------------------------- Conquistas
  function renderAchievements() {
    const el = $('ach-list');
    el.innerHTML = '';
    ACHIEVEMENTS.forEach(a => {
      const got = !!state.ach[a.id];
      const d = document.createElement('div');
      d.className = 'ach' + (got ? ' got' : '');
      d.innerHTML = `<span class="ach-icon">${got ? a.icon : '🔒'}</span><div><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></div><span class="ach-coins">+${a.coins} 🪙</span>`;
      el.appendChild(d);
    });
    $('ach-count').textContent = `${Object.keys(state.ach).length} de ${ACHIEVEMENTS.length}`;
  }

  // ---------------------------------------------------------- Perfil
  function renderProfile() {
    const ids = Object.keys(PHASES),
      doneN = ids.filter(p => state.done[p]).length,
      readN = LIBRARY.filter(a => state.read[a.id]).length;
    const totalXp = ids.filter(p => state.done[p]).reduce((s, p) => s + PHASES[p].reward.xp, 0),
      mins = Math.floor(state.stats.seconds / 60);
    const nameEl = $('pf-name');
    nameEl.value = state.name === 'Aprendiz' ? '' : state.name;
    nameEl.oninput = e => {
      state.name = e.target.value.trim().slice(0, 18) || 'Aprendiz';
      save();
      renderHud();
    };
    $('pf-stats').innerHTML = [
      ['Nível', state.level],
      ['XP total', totalXp],
      ['Fases', `${doneN}/${ids.length}`],
      ['Artigos lidos', `${readN}/${LIBRARY.length}`],
      ['Moedas', state.coins],
      ['Estrelas', `${Object.values(state.stars).reduce((a, b) => a + b, 0)}/${ids.length * 3}`],
      ['Conquistas', `${Object.keys(state.ach).length}/${ACHIEVEMENTS.length}`],
      ['Sequência', `${state.daily.streak} dia(s)`],
      ['Erros nos desafios', state.stats.attempts],
      ['Tempo no mundo', mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}min`],
    ]
      .map(([k, v]) => `<div class="stat"><b>${esc(v)}</b><small>${esc(k)}</small></div>`)
      .join('');
    $('pf-tracks').innerHTML = TRACKS.map(tr => {
      const phs = ids.filter(p => PHASES[p].tag === tr),
        arts = LIBRARY.filter(a => a.track === tr),
        got = phs.filter(p => state.done[p]).length + arts.filter(a => state.read[a.id]).length,
        tot = phs.length + arts.length;
      return `<div class="track" style="--c:${trackColor(tr)}"><div class="track-head"><b>${esc(tr)}</b><span>${phs.filter(p => state.done[p]).length}/${phs.length} fases · ${arts.filter(a => state.read[a.id]).length}/${arts.length} artigos</span></div><div class="track-bar"><div style="width:${tot ? (got / tot) * 100 : 0}%"></div></div></div>`;
    }).join('');
    $('pf-items').innerHTML = ids
      .map(p => {
        const it = PHASES[p].reward.item,
          has = state.inventory.includes(it.id);
        return `<div class="item${has ? ' has' : ''}"><span>${has ? it.emoji : '?'}</span><b>${has ? esc(it.name) : '???'}</b><small>${esc(PHASES[p].name)}</small></div>`;
      })
      .join('');
    const cert = $('pf-cert');
    cert.innerHTML = state.exam
      ? `<p>Aprovado no Exame Final com <b>${state.exam.score}/${state.exam.total}</b> em ${state.exam.date.split('-').reverse().join('/')} · código <code>${esc(state.exam.code)}</code></p><button class="btn primary" id="pf-cert-btn">🎓 Ver e baixar certificado</button>`
      : Exam.allDone()
        ? '<p>Todas as fases concluídas! Vá até a estátua do <b>Exame Final</b>, no alto da praça da Academia.</p>'
        : `<p class="muted">O certificado é liberado ao concluir as ${ids.length} fases (${doneN}/${ids.length}) e passar no Exame Final (${EXAM.pass}/${EXAM.questions}).</p>`;
    if (state.exam) $('pf-cert-btn').onclick = Certificate.show;
    $('pf-export').onclick = () => {
      save();
      const blob = new Blob([localStorage.getItem(SAVE_KEY) || '{}'], { type: 'application/json' }),
        a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'coderealm-save.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    $('pf-import').onchange = e => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const d = JSON.parse(r.result);
          if (d.version !== 3 || !MAPS[d.map]) throw new Error('versão');
          saveBackup();
          localStorage.setItem(SAVE_KEY, JSON.stringify(d));
          location.reload();
        } catch (_) {
          UI.toast('Arquivo de save inválido.');
        }
      };
      e.target.value = '';
      r.readAsText(f);
    };
  }

  // ---------------------------------------------------------- Configurações
  function renderSettings() {
    const el = $('settings-form');
    if (el.dataset.ready) return syncSettings();
    el.dataset.ready = '1';
    const range = (key, label) =>
      `<label class="set-row"><span>${label}</span><input type="range" min="0" max="100" step="5" data-set="${key}" aria-label="${label}"><output data-out="${key}"></output></label>`;
    const select = (key, label, opts) =>
      `<label class="set-row"><span>${label}</span><select data-set="${key}">${opts.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>`;
    const check = (key, label, help) =>
      `<label class="set-row check"><input type="checkbox" data-set="${key}"><span>${label}<small>${help}</small></span></label>`;
    el.innerHTML = `
      <fieldset><legend>Som</legend>${range('music', 'Música')}${range('sfx', 'Efeitos')}</fieldset>
      <fieldset><legend>Gráficos</legend>${select('quality', 'Qualidade', [
        ['auto', 'Automática (recomendado)'],
        ['alta', 'Alta: sombras suaves'],
        ['media', 'Média'],
        ['baixa', 'Baixa: PC fraco ou celular'],
      ])}</fieldset>
      <fieldset><legend>Acessibilidade</legend>${check('reducedMotion', 'Movimento reduzido', 'Sem balanço de árvores, partículas e zoom da câmera.')}${select(
        'textSpeed',
        'Velocidade do diálogo',
        [
          ['normal', 'Normal'],
          ['rapida', 'Rápida'],
          ['instantanea', 'Instantânea'],
        ],
      )}${select('touch', 'Controles de toque', [
        ['auto', 'Automático (celular/tablet)'],
        ['sempre', 'Sempre mostrar'],
        ['nunca', 'Nunca mostrar'],
      ])}</fieldset>
      <fieldset><legend>Ajuda</legend><button type="button" class="btn ghost" id="set-tutorial">Ver o tutorial de novo</button><button type="button" class="btn ghost" id="set-defaults">Restaurar padrões</button></fieldset>`;
    el.querySelectorAll('[data-set]').forEach(inp =>
      inp.addEventListener(inp.type === 'range' ? 'input' : 'change', () => {
        const k = inp.dataset.set;
        settings[k] = inp.type === 'checkbox' ? inp.checked : inp.type === 'range' ? Number(inp.value) : inp.value;
        saveSettings();
        applySettings(k);
        syncSettings();
      }),
    );
    $('set-tutorial').onclick = () => {
      settings.tutorialSeen = false;
      saveSettings();
      UI.toast('O tutorial aparece quando você voltar ao jogo.');
    };
    $('set-defaults').onclick = () => {
      Object.assign(settings, SETTINGS_DEFAULTS, { tutorialSeen: true });
      saveSettings();
      ['music', 'quality', 'reducedMotion'].forEach(applySettings);
      syncSettings();
      UI.toast('Configurações restauradas.');
    };
    syncSettings();
  }
  function syncSettings() {
    document.querySelectorAll('#settings-form [data-set]').forEach(inp => {
      const v = settings[inp.dataset.set];
      if (inp.type === 'checkbox') inp.checked = !!v;
      else inp.value = v;
    });
    document.querySelectorAll('#settings-form [data-out]').forEach(o => {
      o.textContent = settings[o.dataset.out] + '%';
    });
  }
  function applySettings(k) {
    if (k === 'music' || k === 'sfx') {
      Sfx.applyVolumes();
      if (k === 'sfx') Sfx.click();
    }
    if (k === 'quality' || k === 'reducedMotion') applyQuality();
  }

  return { init, open, play, renderSettings };
})();
