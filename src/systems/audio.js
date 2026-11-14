/* =====================================================================
   CodeRealm — som 100% gerado por código (Web Audio API).
   Sem arquivos de áudio: cada efeito é um ou mais osciladores com
   envelope de volume. A música é um arpejo calmo em loop.
   ===================================================================== */

const Sfx = (() => {
  const MUTE_KEY = 'coderealm:muted';
  let ctx = null,
    master = null,
    musicBus = null,
    sfxBus = null,
    musicTimer = null,
    step = 0,
    lastStep = 0;
  let muted = false;
  try {
    muted = localStorage.getItem(MUTE_KEY) === '1';
  } catch (_) {}

  // O navegador só libera áudio depois de um clique/tecla: por isso tudo passa por ensure().
  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
      musicBus = ctx.createGain();
      musicBus.connect(master);
      sfxBus = ctx.createGain();
      sfxBus.connect(master);
      applyVolumes();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  // Uma nota: oscilador + envelope (ataque rápido, queda suave).
  function tone(freq, dur, { type = 'sine', vol = 0.2, at = 0, slide = 0, dest = null } = {}) {
    if (!ensure()) return;
    const t0 = ctx.currentTime + at,
      o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(dest || sfxBus);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  const fx = {
    step() {
      const n = performance.now();
      if (n - lastStep < 120) return;
      lastStep = n;
      tone(150 + Math.random() * 40, 0.06, { type: 'triangle', vol: 0.05 });
    },
    blip() {
      tone(620 + Math.random() * 80, 0.05, { type: 'square', vol: 0.035 });
    },
    open() {
      tone(330, 0.12, { type: 'triangle', vol: 0.12 });
      tone(495, 0.16, { type: 'triangle', vol: 0.12, at: 0.08 });
    },
    ok() {
      tone(660, 0.1, { vol: 0.14 });
      tone(880, 0.18, { vol: 0.14, at: 0.09 });
    },
    bad() {
      tone(200, 0.16, { type: 'sawtooth', vol: 0.07, slide: -70 });
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, { type: 'triangle', vol: 0.16, at: i * 0.11 }));
      tone(1568, 0.5, { vol: 0.08, at: 0.44 });
    },
    portal() {
      tone(300, 0.5, { vol: 0.1, slide: 600 });
    },
    click() {
      tone(520, 0.04, { type: 'triangle', vol: 0.06 });
    },
    coin() {
      tone(988, 0.07, { type: 'square', vol: 0.05 });
      tone(1319, 0.16, { type: 'square', vol: 0.05, at: 0.06 });
    },
    chest() {
      tone(392, 0.12, { type: 'triangle', vol: 0.1 });
      tone(523, 0.12, { type: 'triangle', vol: 0.1, at: 0.1 });
      tone(784, 0.3, { type: 'triangle', vol: 0.12, at: 0.2 });
    },
  };

  // Música: Am – F – C – G, uma nota do arpejo a cada 300 ms + baixo no início do compasso.
  const CHORDS = [
    [220, 261.6, 329.6, 440],
    [174.6, 220, 261.6, 349.2],
    [261.6, 329.6, 392, 523.3],
    [196, 246.9, 293.7, 392],
  ];
  const PATTERN = [0, 1, 2, 3, 2, 1, 2, 1];
  function tick() {
    if (!ctx || muted) return;
    const chord = CHORDS[Math.floor(step / 8) % 4],
      i = step % 8;
    tone(chord[PATTERN[i]] * 2, 0.9, { vol: 0.5, dest: musicBus });
    if (i === 0) tone(chord[0] / 2, 2.2, { type: 'triangle', vol: 0.6, dest: musicBus });
    step++;
  }
  function startMusic() {
    if (!ensure() || musicTimer) return;
    musicTimer = setInterval(tick, 300);
  }
  function stopMusic() {
    clearInterval(musicTimer);
    musicTimer = null;
  }

  // Volumes das Configurações (0..100). A música fica bem mais baixa que os efeitos por natureza.
  function applyVolumes() {
    if (!ctx) return;
    musicBus.gain.value = 0.32 * (settings.music / 100);
    sfxBus.gain.value = settings.sfx / 100;
  }
  function setMuted(v) {
    muted = v;
    try {
      localStorage.setItem(MUTE_KEY, v ? '1' : '0');
    } catch (_) {}
    if (master) master.gain.value = v ? 0 : 0.5;
    document.querySelectorAll('.btn-mute').forEach(b => {
      b.textContent = v ? '🔇' : '🔊';
      b.title = v ? 'Ligar som' : 'Desligar som';
    });
  }
  function bind() {
    document.querySelectorAll('.btn-mute').forEach(b => {
      const target = b.closest('.btn-mute-row') || b;
      target.onclick = () => {
        ensure();
        setMuted(!muted);
      };
    });
    setMuted(muted);
  }

  return Object.assign(
    {
      ensure,
      startMusic,
      stopMusic,
      setMuted,
      applyVolumes,
      bind,
      get muted() {
        return muted;
      },
    },
    fx,
  );
})();
