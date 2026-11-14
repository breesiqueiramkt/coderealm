/* =====================================================================
   CodeRealm — interfaces: diálogo RPG, modal de desafio e os 5 tipos
   de desafio (dragdrop, css, js, terminal, file). v5: estrelas por
   desempenho (erros e dicas contam) e modal genérico para minijogos. Depende de PHASES (phases.js)
   e de state/solvePhase (game.js).
   ===================================================================== */

const UI = (() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // ---------------------------------------------------------- Dicas
  const HINTS = {
    vale: 'Fale com a mentora (!) e depois vá até a ponte quebrada.',
    rio: 'O Totem Flex está ao sul. Depois, encoste nas plataformas.',
    portao: 'Procure a coruja de bronze. O portão está no muro.',
    forja: 'Mestre Kael está ao sul. O goblin bloqueia a passagem.',
    moldes: 'Mestre Kael está ao sul. A bigorna bloqueia a passagem.',
    portos: 'Fale com a Capitã Nia. A ponte levadiça está erguida.',
    cofres: 'O Arquivista Rune está ao sul. A porta do cofre está trancada.',
    orquestra: 'Procure a Maestrina Vela. A pauta dourada fecha o caminho.',
    clareira: 'Parabéns! Você concluiu a jornada. Esc abre o menu.',
  };
  function setHint(mapName) {
    const h = $('hint');
    let txt = HINTS[mapName] || '';
    if (mapName === 'academia') {
      const next = PHASE_ORDER.find(p => !state.done[p]);
      txt = !state.talked.reitora
        ? 'Fale com a Reitora Byte (!) ao lado da fonte.'
        : next
          ? `Próximo portal: ${PHASE_ORDER.indexOf(next) + 1} · ${PHASES[next].tag} (${MAP_NAMES[next]}), lá em cima.`
          : 'Todas as fases concluídas! A estátua do Exame Final está no alto da praça.';
    } else if (MAPS[mapName] && MAPS[mapName].portals) txt += ' · Portal ⌂ à esquerda volta para a Academia.';
    h.textContent = txt;
    h.classList.remove('gone');
  }

  // ---------------------------------------------------------- Diálogo
  let dlg = null;
  function openDialogue(phaseId) {
    const ph = PHASES[phaseId] || GUIDES[phaseId];
    if (!ph) return;
    state.locked = true;
    state.talking = true;
    dlg = { lines: ph.dialogue, i: 0, phaseId, typing: null };
    $('dialog-name').textContent = `${ph.mentor.emoji} ${ph.mentor.name}`;
    $('dialog').classList.remove('hidden');
    showLine();
  }
  function showLine() {
    Sfx.blip();
    const box = $('dialog-text'),
      line = dlg.lines[dlg.i];
    box.textContent = '';
    let k = 0;
    clearInterval(dlg.typing);
    dlg.typing = null;
    const ms = TEXT_SPEED_MS[settings.textSpeed]; // velocidade escolhida nas Configurações
    if (!ms) box.textContent = line;
    else
      dlg.typing = setInterval(() => {
        box.textContent = line.slice(0, ++k);
        if (k >= line.length) {
          clearInterval(dlg.typing);
          dlg.typing = null;
        }
      }, ms);
    $('dialog-next').textContent = dlg.i === dlg.lines.length - 1 ? 'Entendi ✓' : 'Próximo ▸';
    $('dialog-count').textContent = `${dlg.i + 1}/${dlg.lines.length}`;
  }
  function nextLine() {
    if (!dlg) return;
    if (dlg.typing) {
      clearInterval(dlg.typing);
      dlg.typing = null;
      $('dialog-text').textContent = dlg.lines[dlg.i];
      return;
    }
    if (dlg.i < dlg.lines.length - 1) {
      dlg.i++;
      showLine();
      return;
    }
    state.talked[dlg.phaseId] = true;
    save();
    $('dialog').classList.add('hidden');
    dlg = null;
    state.locked = false;
    state.talking = false;
    setHint(state.map); // a dica muda depois da conversa (ex.: Reitora → próximo portal)
  }
  $('dialog-next').onclick = nextLine;
  addEventListener('keydown', e => {
    if (dlg && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      nextLine();
    }
  });

  // ---------------------------------------------------------- Modal
  let current = null; // { phaseId, practice, cleanup }
  function openObstacle(phaseId, practice = false) {
    const ph = PHASES[phaseId];
    if (!practice && !state.talked[phaseId]) {
      toast(`Fale com ${ph.mentor.name} primeiro. ${ph.mentor.emoji}`);
      return;
    }
    state.locked = true;
    current = { phaseId, practice, errors: 0, hints: 0 };
    Sfx.open();
    $('modal').classList.toggle('practice', practice);
    $('modal-tag').textContent = ph.tag;
    $('modal-tag').style.background = ph.color;
    $('modal-title').textContent = ph.obstacleName;
    $('modal-intro').textContent = ph.obstacleIntro;
    $('modal-backdrop').classList.remove('hidden');
    const body = $('modal-body');
    body.innerHTML = '';
    BUILD()[ph.challenge.type](ph, body);
  }
  // Modal genérico (minidesafios, projetos): build(body) desenha o conteúdo
  function openModal(o, build) {
    state.locked = true;
    current = { phaseId: null, practice: !!o.practice, errors: 0, hints: 0, generic: true };
    Sfx.open();
    $('modal').classList.toggle('practice', !!o.practice);
    $('modal-tag').textContent = o.tag || '';
    $('modal-tag').style.background = o.color || '#8b5cf6';
    $('modal-title').textContent = o.title || '';
    $('modal-intro').textContent = o.intro || '';
    $('modal-backdrop').classList.remove('hidden');
    const body = $('modal-body');
    body.innerHTML = '';
    build(body);
  }
  function closeModal() {
    $('modal-backdrop').classList.add('hidden');
    if (current && current.cleanup) current.cleanup();
    current = null;
    state.locked = false;
  }
  $('modal-close').onclick = closeModal;

  function succeed(ph) {
    const body = $('modal-body');
    if (current && current.generic) {
      Sfx.ok();
      return;
    } // modal genérico (projetos): quem abriu decide o que fazer
    if (ph.challenge.next) {
      // desafio em 2 partes: abre a parte seguinte no mesmo modal
      const ph2 = Object.assign({}, ph, { challenge: ph.challenge.next });
      $('modal-intro').textContent = 'Parte 2 de 2. ' + (ph2.challenge.banner || '');
      body.innerHTML = '';
      BUILD()[ph2.challenge.type](ph2, body);
      return;
    }
    Sfx.win();
    if (current && current.practice) {
      body.innerHTML = `<div class="reward"><div class="reward-item">🎯</div><h3>Treino concluído!</h3><p>${esc(ph.success)}</p><p class="muted">Modo treino: nada foi salvo e nenhum XP foi dado. Repita quantas vezes quiser.</p><button class="btn primary" id="btn-reward">Fechar</button></div>`;
      $('modal-intro').textContent = '';
      $('btn-reward').onclick = closeModal;
      return;
    }
    const stars = Rewards.starsFor(current ? current.errors : 0, current ? current.hints : 0),
      first = !state.done[ph.id],
      coins = Rewards.phaseCoins(ph.id, stars),
      prev = state.stars[ph.id] || 0;
    body.innerHTML = `
      <div class="reward">
        <div class="reward-item">${ph.reward.item.emoji}</div>
        <div class="stars">${[1, 2, 3].map(i => `<span class="star${i <= stars ? ' on' : ''}" style="animation-delay:${i * 0.25}s">★</span>`).join('')}</div>
        <div class="stars-why muted">${stars === 3 ? 'Sem erros e sem dicas. Perfeito!' : stars === 2 ? `${current.errors} erro(s)${current.hints ? ' e ' + current.hints + ' dica(s)' : ''}. Quase perfeito.` : 'Concluído! Repita a fase para buscar 3 estrelas.'}</div>
        <h3>Obstáculo removido!</h3>
        <p>${esc(ph.success)}</p>
        <p>${first ? `Você ganhou <strong class="xp">+${ph.reward.xp} XP</strong>, o item <strong>${esc(ph.reward.item.name)}</strong>` : 'Fase repetida: sem XP novo'}${coins ? `${first ? ' e' : ', mas'} <strong class="xp">+${coins} 🪙</strong>${!first ? ' por melhorar as estrelas' : ''}` : ''}.</p>
        <button class="btn primary" id="btn-reward">Seguir viagem →</button>
      </div>`;
    $('modal-intro').textContent = '';
    if (prev && stars > prev) Sfx.coin();
    $('btn-reward').onclick = () => {
      $('modal-backdrop').classList.add('hidden');
      if (current && current.cleanup) current.cleanup();
      current = null;
      solvePhase(ph.id, stars);
    };
  }
  function toast(msg) {
    const tt = $('toast');
    if (!tt) return;
    tt.textContent = msg;
    tt.classList.add('show');
    clearTimeout(tt._t);
    tt._t = setTimeout(() => tt.classList.remove('show'), 2200);
  }
  function feedback(el, msg, ok, silent) {
    el.textContent = msg;
    el.className = 'feedback ' + (ok ? 'ok' : 'bad');
    if (silent) {
      if (current) current.hints++;
      return;
    }
    if (ok) Sfx.ok();
    else {
      Sfx.bad();
      if (current) {
        current.errors++;
        if (!current.practice) state.stats.attempts++;
      }
    }
  }
  const BUILD = () => ({ dragdrop: buildDragDrop, css: buildCss, js: buildJs, terminal: buildTerminal, file: buildFile });

  // ---------------------------------------------------------- 1. Drag & drop (HTML)
  function buildDragDrop(ph, body) {
    const ch = ph.challenge;
    const placed = {};
    let selected = null;
    body.innerHTML = `
      <div class="dd">
        <div class="dd-skel" id="dd-skel"></div>
        <div class="dd-side">
          <div class="dd-label">Blocos</div>
          <div class="dd-palette" id="dd-palette"></div>
          <div class="dd-label">Ponte</div>
          <div class="bridge" id="bridge"></div>
          <button class="btn primary" id="dd-test">Testar a ponte</button>
          <button class="btn ghost" id="dd-hint">Dica</button>
          <p class="feedback" id="dd-fb"></p>
        </div>
      </div>`;
    const skel = $('dd-skel'),
      pal = $('dd-palette'),
      bridge = $('bridge');
    const slotIds = Object.keys(ch.answer);
    slotIds.forEach(() => {
      const p = document.createElement('span');
      p.className = 'plank';
      bridge.appendChild(p);
    });

    const slotHtml = id => `<span class="slot-tag" data-slot="${id}" draggable="false">___</span>`;
    ch.skeleton.forEach(row => {
      const div = document.createElement('div');
      div.className = 'dd-row';
      div.style.paddingLeft = `${row.indent * 18}px`;
      let html = '';
      if (row.text) html = `<span class="fixed">${esc(row.text)}</span>`;
      else if (row.open && row.inline)
        html = `&lt;${slotHtml(row.open)}&gt;<span class="fixed">${esc(row.inline)}</span>&lt;/<span class="mirror" data-mirror="${row.closeInline}">___</span>&gt;`;
      else if (row.open) html = `&lt;${slotHtml(row.open)}&gt;`;
      else if (row.close) html = `&lt;/<span class="mirror" data-mirror="${row.close}">___</span>&gt;`;
      div.innerHTML = html;
      skel.appendChild(div);
    });
    ch.palette.forEach(tag => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.textContent = tag;
      chip.draggable = true;
      chip.onclick = () => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('sel'));
        selected = tag;
        chip.classList.add('sel');
      };
      chip.ondragstart = e => {
        e.dataTransfer.setData('text/plain', tag);
        selected = tag;
      };
      pal.appendChild(chip);
    });
    const refresh = () => {
      slotIds.forEach((id, i) => {
        const v = placed[id];
        skel.querySelectorAll(`[data-slot="${id}"],[data-mirror="${id}"]`).forEach(el => {
          el.textContent = v || '___';
          el.classList.toggle('filled', !!v);
          el.classList.remove('wrong', 'right');
        });
        bridge.children[i].classList.toggle('on', !!v);
      });
    };
    skel.querySelectorAll('.slot-tag').forEach(slot => {
      const id = slot.dataset.slot;
      const put = tag => {
        if (!tag) return;
        placed[id] = tag;
        refresh();
      };
      slot.onclick = () => {
        if (placed[id] && !selected) {
          delete placed[id];
          refresh();
          return;
        }
        put(selected);
      };
      slot.ondragover = e => {
        e.preventDefault();
        slot.classList.add('over');
      };
      slot.ondragleave = () => slot.classList.remove('over');
      slot.ondrop = e => {
        e.preventDefault();
        slot.classList.remove('over');
        put(e.dataTransfer.getData('text/plain'));
      };
    });
    $('dd-hint').onclick = () => {
      const miss = slotIds.find(id => placed[id] !== ch.answer[id]);
      feedback($('dd-fb'), miss ? ch.hints[miss] : 'Está tudo certo. Clique em Testar!', false, true);
    };
    $('dd-test').onclick = () => {
      const fb = $('dd-fb');
      let firstWrong = null;
      slotIds.forEach(id => {
        const ok = placed[id] === ch.answer[id];
        skel.querySelectorAll(`[data-slot="${id}"],[data-mirror="${id}"]`).forEach(el => el.classList.add(ok ? 'right' : 'wrong'));
        if (!ok && !firstWrong) firstWrong = id;
      });
      if (!firstWrong) {
        feedback(fb, 'Estrutura perfeita!', true);
        setTimeout(() => succeed(ph), 800);
        return;
      }
      const hint =
        placed[firstWrong] === 'head' && firstWrong === 's3'
          ? 'O <head> nunca fica dentro do <body>: ele é irmão do body.'
          : ch.hints[firstWrong];
      feedback(fb, (placed[firstWrong] ? `"${placed[firstWrong]}" não é o bloco certo aqui. ` : 'Falta um bloco. ') + hint, false);
    };
  }

  // ---------------------------------------------------------- 2. Editor CSS (iframe + getComputedStyle)
  function buildCss(ph, body) {
    const ch = ph.challenge;
    body.innerHTML = `
      <div class="ide">
        <div class="ide-pane">
          <div class="ide-bar">style.css</div>
          <textarea class="editor" id="css-editor" spellcheck="false"></textarea>
        </div>
        <div class="ide-pane">
          <div class="ide-bar">rio.html (ao vivo)</div>
          <iframe id="css-preview" class="preview" sandbox="allow-same-origin"></iframe>
        </div>
      </div>
      <div class="ide-foot"><button class="btn primary" id="css-test">Testar</button><button class="btn ghost" id="css-hint">Dica</button><p class="feedback" id="css-fb"></p></div>`;
    const ed = $('css-editor'),
      fr = $('css-preview');
    ed.value = ch.starter;
    enableTab(ed);
    const renderPreview = () => {
      fr.srcdoc = `<!doctype html><style>${ch.previewBase}</style><style>${ed.value}</style>${ch.previewHtml}`;
    };
    let deb;
    ed.oninput = () => {
      clearTimeout(deb);
      deb = setTimeout(renderPreview, 250);
    };
    renderPreview();
    $('css-hint').onclick = () => {
      const doc = fr.contentDocument;
      if (!doc || !doc.querySelector('.rio')) return;
      const win = fr.contentWindow,
        s = { rio: win.getComputedStyle(doc.querySelector('.rio')), plat: win.getComputedStyle(doc.querySelector('.plataforma')) };
      const fail = ch.checks.find(c => !c.test(s));
      feedback($('css-fb'), fail ? fail.hint : 'Está tudo certo. Clique em Testar!', false, true);
    };
    $('css-test').onclick = () => {
      const fb = $('css-fb');
      const doc = fr.contentDocument;
      if (!doc || !doc.querySelector('.rio')) {
        feedback(fb, 'Preview ainda carregando, tente de novo.', false);
        return;
      }
      const win = fr.contentWindow,
        s = { rio: win.getComputedStyle(doc.querySelector('.rio')), plat: win.getComputedStyle(doc.querySelector('.plataforma')) };
      const fail = ch.checks.find(c => !c.test(s));
      if (fail) {
        feedback(fb, fail.hint, false);
        return;
      }
      feedback(fb, 'Alinhamento perfeito!', true);
      setTimeout(() => succeed(ph), 800);
    };
  }

  // ---------------------------------------------------------- 3. Editor JS (Web Worker com timeout)
  function buildJs(ph, body) {
    const ch = ph.challenge;
    let hintN = 0;
    body.innerHTML = `
      <div class="ide one">
        <div class="ide-pane">
          <div class="ide-bar">portao.js</div>
          <textarea class="editor tall" id="js-editor" spellcheck="false"></textarea>
        </div>
      </div>
      <div class="tests" id="js-tests">${ch.tests.map(tt => `<div class="test"><span class="dot"></span>${esc(tt.label)}</div>`).join('')}</div>
      <div class="ide-foot"><button class="btn primary" id="js-run">▶ Rodar testes</button><button class="btn ghost" id="js-hint">Dica</button><p class="feedback" id="js-fb"></p></div>`;
    const ed = $('js-editor');
    ed.value = ch.starter;
    enableTab(ed);
    $('js-hint').onclick = () => {
      feedback($('js-fb'), ch.hints[Math.min(hintN++, ch.hints.length - 1)], false, true);
    };
    $('js-run').onclick = () =>
      runTests(ed.value, ch, res => {
        const fb = $('js-fb'),
          rows = $('js-tests').children;
        if (res.error) {
          feedback(fb, friendlyError(res.error, ed.value), false);
          return;
        }
        let allOk = true;
        res.results.forEach((r, i) => {
          rows[i].classList.toggle('pass', r.ok);
          rows[i].classList.toggle('fail', !r.ok);
          if (!r.ok) allOk = false;
        });
        if (allOk) {
          feedback(fb, 'Todos os testes passaram!', true);
          setTimeout(() => succeed(ph), 800);
        } else {
          const f = res.results.find(r => !r.ok);
          feedback(fb, `Falhou: ${ch.tests[res.results.indexOf(f)].label} (recebeu ${JSON.stringify(f.got)})`, false);
        }
      });
  }
  // Traduz erros de sintaxe do navegador para algo que um iniciante entende.
  function friendlyError(msg, code) {
    if (/if\s*\(\s*\)/.test(code))
      return 'O if está vazio. Coloque uma condição entre os parênteses, por exemplo: if (senha === senhaCorreta)';
    if (/Unexpected token '\)'/.test(msg)) return 'Tem um ) sobrando ou falta algo antes dele. Confira os parênteses da condição.';
    if (/Unexpected end of input/.test(msg)) return 'O código terminou antes da hora: falta fechar uma chave } ou um parêntese ).';
    if (/Unexpected token '\}'/.test(msg)) return 'Tem uma } sobrando ou falta algo antes dela.';
    if (/is not defined/.test(msg))
      return 'Erro: ' + msg.replace('is not defined', 'não existe') + '. Confira o nome da variável (maiúsculas e minúsculas contam).';
    if (/Invalid or unexpected token/.test(msg)) return 'Tem um caractere estranho no código. Confira se todas as aspas abrem e fecham.';
    return 'Erro no código: ' + msg;
  }
  function runTests(code, ch, cb) {
    const src = `
      self.onmessage = e => {
        const { code, fn, tests } = e.data;
        try {
          const f = new Function(code + '\\n;return typeof ' + fn + '==="function" ? ' + fn + ' : null;')();
          if (!f) { self.postMessage({ error: 'a função ' + fn + ' não existe (não apague o nome dela)' }); return; }
          self.postMessage({ results: tests.map(t => { try { const got = f(...t.args); return { ok: got === t.expect, got }; } catch (err) { return { ok: false, got: 'erro: ' + err.message }; } }) });
        } catch (err) { self.postMessage({ error: err.message }); }
      };`;
    let done = false;
    const finish = r => {
      if (!done) {
        done = true;
        cb(r);
      }
    };
    try {
      const w = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      const timer = setTimeout(() => {
        w.terminate();
        finish({ error: 'tempo esgotado (loop infinito?)' });
      }, 2000);
      w.onmessage = e => {
        clearTimeout(timer);
        w.terminate();
        finish(e.data);
      };
      w.onerror = e => {
        clearTimeout(timer);
        w.terminate();
        finish({ error: e.message || 'erro de sintaxe' });
      };
      w.postMessage({ code, fn: ch.fnName, tests: ch.tests });
    } catch (_) {
      // fallback (navegador sem Worker em file://): roda na própria página, sem timeout
      try {
        const f = new Function(code + `\n;return ${ch.fnName};`)();
        finish({
          results: ch.tests.map(t => {
            try {
              const got = f(...t.args);
              return { ok: got === t.expect, got };
            } catch (err) {
              return { ok: false, got: 'erro: ' + err.message };
            }
          }),
        });
      } catch (err) {
        finish({ error: err.message });
      }
    }
  }

  // ---------------------------------------------------------- 4. Terminal Docker simulado
  // A lógica do Docker de mentira está em src/systems/docker-sim.js; aqui só desenhamos o terminal.
  function buildTerminal(ph, body, free = false) {
    const ch = ph.challenge;
    const sim = DockerSim.create({ images: ch.images, files: ch.files, goal: ch.goal, check: ch.check, successLine: ch.successLine, free });
    body.innerHTML = `
      <div class="term" id="term">
        <div class="term-out" id="term-out" role="log" aria-live="polite"></div>
        <div class="term-line"><span class="term-prompt">${esc(ch.prompt)}</span><input id="term-in" autocomplete="off" spellcheck="false" aria-label="Comando do terminal" /></div>
      </div>
      <p class="feedback" id="term-fb"></p>`;
    const out = body.querySelector('#term-out'),
      inp = body.querySelector('#term-in'),
      fb = body.querySelector('#term-fb'),
      history = [];
    const print = (txt, cls = '') => {
      const d = document.createElement('div');
      d.className = 'term-row ' + cls;
      d.textContent = txt;
      out.appendChild(d);
      out.scrollTop = out.scrollHeight;
    };
    print(ch.banner || 'Terminal. Digite help para ver os comandos.', 'muted');
    setTimeout(() => inp.focus(), 100);
    const exec = line => {
      print(`${ch.prompt} ${line}`, 'cmd');
      const r = sim.exec(line);
      if (r.clear) out.innerHTML = '';
      r.lines.forEach(l => print(l.text, l.cls));
      if (r.feedback) feedback(fb, r.feedback.msg, r.feedback.ok);
      if (r.solved) setTimeout(() => succeed(ph), 900);
    };
    let hi = -1;
    inp.onkeydown = e => {
      if (e.key === 'Enter') {
        const v = inp.value;
        history.unshift(v);
        hi = -1;
        inp.value = '';
        exec(v);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        hi = Math.min(hi + 1, history.length - 1);
        inp.value = history[hi] || '';
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        hi = Math.max(hi - 1, -1);
        inp.value = hi < 0 ? '' : history[hi];
      }
      e.stopPropagation();
    };
    if (current) current.cleanup = () => {};
  }

  // ---------------------------------------------------------- 5. Editor de arquivo (Dockerfile / compose) com validação por regras
  function buildFile(ph, body) {
    const ch = ph.challenge;
    let hintN = 0;
    body.innerHTML = `
      <div class="ide one"><div class="ide-pane"><div class="ide-bar">${esc(ch.filename)}</div><textarea class="editor tall" id="file-editor" spellcheck="false"></textarea></div></div>
      <div class="tests" id="file-tests">${ch.rules.map(r => `<div class="test"><span class="dot"></span>${esc(r.label)}</div>`).join('')}</div>
      <div class="ide-foot"><button class="btn primary" id="file-run">▶ Validar</button><button class="btn ghost" id="file-hint">Dica</button><p class="feedback" id="file-fb"></p></div>`;
    const ed = $('file-editor');
    ed.value = ch.starter;
    enableTab(ed);
    $('file-hint').onclick = () => feedback($('file-fb'), ch.hints[Math.min(hintN++, ch.hints.length - 1)], false, true);
    $('file-run').onclick = () => {
      const lines = ed.value
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#')),
        rows = $('file-tests').children;
      let firstFail = null;
      ch.rules.forEach((r, i) => {
        const ok = r.test(lines, ed.value);
        rows[i].classList.toggle('pass', ok);
        rows[i].classList.toggle('fail', !ok);
        if (!ok && !firstFail) firstFail = r;
      });
      if (!firstFail) {
        feedback($('file-fb'), 'Arquivo válido!', true);
        setTimeout(() => succeed(ph), 800);
      } else feedback($('file-fb'), firstFail.hint, false);
    };
  }

  function enableTab(ta) {
    ta.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = ta.selectionStart;
        ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(ta.selectionEnd);
        ta.selectionStart = ta.selectionEnd = s + 2;
        ta.dispatchEvent(new Event('input'));
      }
    });
    ta.addEventListener('keyup', e => e.stopPropagation());
  }

  return {
    setHint,
    openDialogue,
    openObstacle,
    openModal,
    closeModal,
    toast,
    builders: { buildDragDrop, buildCss, buildJs, buildTerminal, buildFile },
    enableTab,
  };
})();
