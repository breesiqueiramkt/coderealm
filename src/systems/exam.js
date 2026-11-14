/* =====================================================================
   CodeRealm — Exame Final e certificado
   O exame abre quando as 8 fases estão concluídas: 10 minidesafios
   misturados, aprovação com 7 ou mais. O certificado é desenhado num
   <canvas> e baixado como PNG, sem servidor.
   ===================================================================== */

const EXAM = { questions: 10, pass: 7, coins: 100 };

const Exam = (() => {
  const allDone = () => Object.keys(PHASES).every(p => state.done[p]);

  function open() {
    const left = Object.keys(PHASES).filter(p => !state.done[p]).length;
    if (!allDone()) {
      UI.toast(`O Exame Final abre quando você concluir todas as fases. Faltam ${left}.`);
      return;
    }
    if (state.exam) {
      Certificate.show();
      return;
    }
    Mini.play({
      track: '*',
      count: EXAM.questions,
      title: 'Exame Final',
      reward: '',
      intro: `${EXAM.questions} desafios de todas as trilhas. Acerte ${EXAM.pass} ou mais para receber o certificado.`,
      onWin: right => {
        if (right >= EXAM.pass) {
          state.exam = { score: right, total: EXAM.questions, date: new Date().toISOString().slice(0, 10), code: certCode(right) };
          Rewards.addCoins(EXAM.coins, 'Aprovado no Exame Final');
          Rewards.check();
          save();
          saveBackup();
          setTimeout(Certificate.show, 300);
        } else UI.toast(`Você fez ${right}/${EXAM.questions}. Precisa de ${EXAM.pass}. Revise na Biblioteca e tente de novo!`);
      },
    });
  }
  // Código curto derivado do nome, nota e data (identifica o certificado, não é um selo oficial)
  function certCode(score) {
    const base = `${state.name}|${score}|${new Date().toISOString().slice(0, 10)}|${Object.values(state.stars).join('')}`;
    let h = 2166136261;
    for (const ch of base) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return 'CR-' + (h >>> 0).toString(36).toUpperCase().padStart(7, '0');
  }
  return { open, allDone };
})();

const Certificate = (() => {
  const W = 1600,
    H = 1130;
  const fmtDate = iso => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  function draw(canvas) {
    canvas.width = W;
    canvas.height = H;
    const c = canvas.getContext('2d'),
      ex = state.exam;
    const stars = Object.values(state.stars).reduce((a, b) => a + b, 0),
      maxStars = Object.keys(PHASES).length * 3;
    // fundo e moldura
    const bg = c.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#fbf6ea');
    bg.addColorStop(1, '#f1e7cf');
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);
    c.strokeStyle = '#4b2fa0';
    c.lineWidth = 18;
    c.strokeRect(40, 40, W - 80, H - 80);
    c.strokeStyle = '#c99a2e';
    c.lineWidth = 4;
    c.strokeRect(72, 72, W - 144, H - 144);
    // cantos
    c.fillStyle = '#c99a2e';
    [
      [72, 72],
      [W - 72, 72],
      [72, H - 72],
      [W - 72, H - 72],
    ].forEach(([x, y]) => {
      c.beginPath();
      c.arc(x, y, 14, 0, 7);
      c.fill();
    });
    c.textAlign = 'center';
    // marca
    c.fillStyle = '#4b2fa0';
    c.font = '700 40px "JetBrains Mono", monospace';
    c.fillText('{ }', W / 2, 175);
    c.fillStyle = '#6b5f86';
    c.font = '700 26px Nunito, sans-serif';
    c.fillText('CODEREALM · ACADEMIA DO CÓDIGO', W / 2, 225);
    // título
    c.fillStyle = '#1a1626';
    c.font = '900 76px Nunito, sans-serif';
    c.fillText('Certificado de Conclusão', W / 2, 335);
    c.fillStyle = '#6b5f86';
    c.font = '400 30px Nunito, sans-serif';
    c.fillText('Certificamos que', W / 2, 420);
    // nome
    let fs = 92;
    c.font = `900 ${fs}px Nunito, sans-serif`;
    while (c.measureText(state.name).width > W - 360 && fs > 40) {
      fs -= 4;
      c.font = `900 ${fs}px Nunito, sans-serif`;
    }
    c.fillStyle = '#4b2fa0';
    c.fillText(state.name, W / 2, 530);
    c.strokeStyle = '#c99a2e';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(W / 2 - 360, 560);
    c.lineTo(W / 2 + 360, 560);
    c.stroke();
    // texto
    c.fillStyle = '#2d2545';
    c.font = '400 32px Nunito, sans-serif';
    c.fillText('concluiu a jornada do CodeRealm, com as 8 fases de', W / 2, 630);
    c.fillText('HTML, CSS, JavaScript e Docker (containers, Dockerfile, portas, volumes e Compose),', W / 2, 676);
    c.fillText(`e foi aprovado(a) no Exame Final com nota ${ex.score}/${ex.total}.`, W / 2, 722);
    // estatísticas
    const box = (x, label, value) => {
      c.fillStyle = 'rgba(75,47,160,.08)';
      c.fillRect(x - 150, 765, 300, 100);
      c.fillStyle = '#4b2fa0';
      c.font = '900 44px Nunito, sans-serif';
      c.fillText(value, x, 818);
      c.fillStyle = '#6b5f86';
      c.font = '700 20px Nunito, sans-serif';
      c.fillText(label, x, 850);
    };
    box(W / 2 - 340, 'ESTRELAS', `${stars}/${maxStars}`);
    box(W / 2, 'NÍVEL', String(state.level));
    box(W / 2 + 340, 'PROJETOS REAIS', `${Object.keys(state.projects).length}/${PROJECTS.length}`);
    // rodapé: data, selo, assinatura
    c.fillStyle = '#2d2545';
    c.font = '400 24px Nunito, sans-serif';
    c.textAlign = 'left';
    c.fillText(`Emitido em ${fmtDate(ex.date)}`, 150, 965);
    c.fillText(`Código: ${ex.code}`, 150, 1001);
    c.textAlign = 'right';
    c.strokeStyle = '#2d2545';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(W - 470, 960);
    c.lineTo(W - 150, 960);
    c.stroke();
    c.font = '700 26px Nunito, sans-serif';
    c.fillText('Reitora Byte', W - 150, 997);
    c.font = '400 20px Nunito, sans-serif';
    c.fillStyle = '#6b5f86';
    c.fillText('Academia do Código', W - 150, 1025);
    // selo
    c.textAlign = 'center';
    c.save();
    c.translate(W / 2, 960);
    c.scale(0.85, 0.85);
    c.fillStyle = '#c99a2e';
    for (let i = 0; i < 16; i++) {
      c.rotate(Math.PI / 8);
      c.fillRect(-8, -78, 16, 22);
    }
    c.beginPath();
    c.arc(0, 0, 66, 0, 7);
    c.fill();
    c.fillStyle = '#4b2fa0';
    c.beginPath();
    c.arc(0, 0, 54, 0, 7);
    c.fill();
    c.fillStyle = '#f5c542';
    c.font = '900 38px Nunito, sans-serif';
    c.fillText('★', 0, 2);
    c.font = '900 14px Nunito, sans-serif';
    c.fillText('APROVADO', 0, 28);
    c.restore();
    c.fillStyle = '#9a8fb0';
    c.font = '400 16px Nunito, sans-serif';
    c.fillText('Certificado de conclusão do jogo educacional CodeRealm. Não é um diploma ou certificação oficial.', W / 2, H - 88);
    return canvas;
  }

  function download() {
    const cv = draw(document.createElement('canvas')),
      a = document.createElement('a');
    a.download = `certificado-coderealm-${state.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.png`;
    a.href = cv.toDataURL('image/png');
    a.click();
  }

  function show() {
    if (!state.exam) {
      UI.toast('Seja aprovado no Exame Final para receber o certificado.');
      return;
    }
    UI.openModal(
      {
        tag: 'Certificado',
        color: '#c99a2e',
        title: 'Você concluiu o CodeRealm!',
        intro: 'Baixe a imagem e compartilhe (LinkedIn, portfólio, grupo da turma).',
      },
      body => {
        body.innerHTML =
          '<div class="cert-wrap"><canvas id="cert-canvas" aria-label="Certificado de conclusão"></canvas></div><div class="ide-foot"><button class="btn primary" id="cert-dl">⬇ Baixar certificado (PNG)</button><button class="btn ghost" id="cert-close">Fechar</button></div>';
        draw(body.querySelector('#cert-canvas'));
        body.querySelector('#cert-dl').onclick = download;
        body.querySelector('#cert-close').onclick = UI.closeModal;
      },
    );
  }
  return { draw, download, show };
})();
