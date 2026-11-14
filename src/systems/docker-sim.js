/* =====================================================================
   CodeRealm — simulador de Docker (lógica pura, sem DOM)
   Nada roda de verdade: um objeto guarda imagens, containers, volumes e
   arquivos, e cada comando muda esse objeto e devolve as linhas que o
   terminal deve mostrar (imitando a saída do Docker real).

   const sim = DockerSim.create({ images, files, check, goal, free });
   const r = sim.exec('docker run -d --name web nginx');
   r.lines    → [{ text, cls }]       linhas para imprimir
   r.feedback → { msg, ok } | null    dica ou confirmação da fase
   r.solved   → true quando o objetivo da fase foi cumprido
   r.clear    → true se o terminal deve ser limpo

   Testado em tests/unit/docker-sim.test.js.
   ===================================================================== */

const DockerSim = (() => {
  const HELP = [
    'Comandos disponíveis:',
    '  docker images                              lista as imagens (moldes)',
    '  docker ps [-a]                             lista containers',
    '  docker run [-d] [--name N] [-p H:C] [-v VOL:/path] [-e K=V] IMG   cria um container',
    '  docker stop | rm | logs NOME               para / remove / mostra saída',
    '  docker build -t NOME:TAG .                 constrói uma imagem a partir do Dockerfile',
    '  docker volume create | ls                  volumes persistentes',
    '  docker compose up -d | down | ps           sobe/derruba os serviços do docker-compose.yml',
    '  ls, cat ARQUIVO, clear                     utilitários',
  ];

  // opts: { images, files, goal, check(docker) => true | 'dica', free, random }
  function create(opts = {}) {
    const docker = {
      images: [...(opts.images || [])],
      containers: [],
      volumes: [],
      files: Object.assign({}, opts.files || {}),
      composeUp: false,
    };
    const rnd = opts.random || Math.random;
    const rid = () =>
      Math.floor(rnd() * 2 ** 48)
        .toString(16)
        .padStart(12, '0');
    let n = 0;

    // Avalia o objetivo da fase depois de um comando que muda o estado
    function evaluate() {
      if (opts.free) return { feedback: null, solved: false };
      let r = true;
      if (opts.check) r = opts.check(docker);
      else if (opts.goal) {
        // Basta UM container cumprir o objetivo (o jogador pode ter tentado antes sem --name)
        const g = opts.goal,
          cs = docker.containers.filter(k => k.running && k.image === g.image);
        const last = cs[cs.length - 1];
        r = cs.some(c => c.detached && (!g.name || c.name === g.name))
          ? true
          : !last
            ? `Ainda não há um container de ${g.image} rodando.`
            : !last.detached
              ? 'Use -d para rodar em segundo plano.'
              : `O nome precisa ser ${g.name} (--name ${g.name}).`;
      }
      if (r === true) return { feedback: { msg: opts.successLine || 'Objetivo cumprido!', ok: true }, solved: true };
      if (typeof r === 'string') return { feedback: { msg: r, ok: r.startsWith('✓') }, solved: false }; // ✓ = passo certo, falta o próximo
      return { feedback: null, solved: false };
    }

    function exec(line) {
      const out = { lines: [], feedback: null, solved: false, clear: false };
      const print = (text, cls = '') => out.lines.push({ text, cls });
      const fail = text => (print(text, 'err'), out);
      const changed = () => Object.assign(out, evaluate());
      const a = String(line).trim().split(/\s+/).filter(Boolean);
      if (!a.length) return out;

      if (a[0] === 'help') {
        HELP.forEach(l => print(l));
        return out;
      }
      if (a[0] === 'clear') {
        out.clear = true;
        return out;
      }
      if (a[0] === 'ls') {
        print(Object.keys(docker.files).join('  ') || '(vazio)');
        return out;
      }
      if (a[0] === 'cat') {
        const f = docker.files[a[1]];
        if (f === undefined) return fail(`cat: ${a[1] || ''}: No such file`);
        f.split('\n').forEach(l => print(l));
        return out;
      }
      if (a[0] !== 'docker') return fail(`${a[0]}: comando não encontrado. Tente help.`);

      const sub = a[1],
        arg = a.slice(2).find(x => !x.startsWith('-')); // primeiro argumento que não é flag
      if (sub === 'images') {
        print('REPOSITORY         TAG        SIZE');
        docker.images.forEach(i => {
          const [r, tg = 'latest'] = i.split(':');
          print(`${r.padEnd(19)}${tg.padEnd(11)}42MB`);
        });
        return out;
      }
      if (sub === 'ps') {
        const all = a.includes('-a');
        print('CONTAINER ID   IMAGE              STATUS      PORTS            NAMES');
        docker.containers
          .filter(c => all || c.running)
          .forEach(c =>
            print(
              `${c.id}   ${c.image.padEnd(18)} ${(c.running ? 'Up' : 'Exited').padEnd(11)} ${(c.ports.map(p => `0.0.0.0:${p.host}->${p.cont}/tcp`).join(', ') || '').padEnd(16)} ${c.name}`,
            ),
          );
        return out;
      }
      if (sub === 'rm') {
        const i = docker.containers.findIndex(c => c.name === arg);
        if (i < 0) return fail(`Error: No such container: ${arg || ''}`);
        if (docker.containers[i].running && !a.includes('-f'))
          return fail(`Error: cannot remove a running container. Use docker stop ${arg} primeiro (ou -f).`);
        docker.containers.splice(i, 1);
        print(arg);
        return changed();
      }
      if (sub === 'logs') {
        const c = docker.containers.find(k => k.name === arg);
        if (!c) return fail(`Error: No such container: ${arg || ''}`);
        print(`[${c.image}] iniciado`);
        if (c.env.length) print(`[${c.image}] env: ${c.env.join(' ')}`);
        print(`[${c.image}] ${c.ports.length ? 'ouvindo na porta ' + c.ports[0].cont : 'pronto, aguardando...'}`);
        return out;
      }
      if (sub === 'stop') {
        const c = docker.containers.find(k => k.name === arg && k.running);
        if (!c) return fail(`Error: No such container: ${arg || ''}`);
        c.running = false;
        print(arg);
        return changed();
      }
      if (sub === 'volume') {
        if (a[2] === 'create') {
          if (!a[3]) return fail('volume create: faltou o nome');
          if (!docker.volumes.includes(a[3])) docker.volumes.push(a[3]);
          print(a[3]);
          return changed();
        }
        if (a[2] === 'ls') {
          print('DRIVER    VOLUME NAME');
          docker.volumes.forEach(v => print(`local     ${v}`));
          return out;
        }
        return fail(`docker volume: '${a[2] || ''}' não é um comando`);
      }
      if (sub === 'build') {
        let tag = null;
        for (let i = 2; i < a.length; i++) if (a[i] === '-t') tag = a[++i];
        if (!a.includes('.')) return fail('"docker build" requires exactly 1 argument: o contexto. Use "." (pasta atual).');
        if (!tag) return fail('Build sem -t cria uma imagem sem nome (<none>). Use -t nome:tag.');
        if (!docker.files['Dockerfile']) return fail('ERROR: failed to solve: Dockerfile not found. Use ls para ver os arquivos.');
        const df = docker.files['Dockerfile'].split('\n').filter(l => l.trim());
        df.forEach((l, i) => print(` => [${i + 1}/${df.length}] ${l}`, 'muted'));
        print(' => exporting to image', 'muted');
        print(` => => naming to docker.io/library/${tag}`, 'muted');
        if (!docker.images.includes(tag)) docker.images.push(tag);
        docker.built = tag;
        return changed();
      }
      if (sub === 'compose') {
        if (!docker.files['docker-compose.yml']) return fail('no configuration file provided: not found (docker-compose.yml)');
        const svcs = (docker.files['docker-compose.yml'].match(/^ {2}(\w[\w-]*):\s*$/gm) || []).map(x => x.trim().slice(0, -1));
        if (a[2] === 'up') {
          if (!a.includes('-d')) {
            print('Attaching to ' + svcs.join(', '));
            print('(terminal preso aos logs... Ctrl+C)', 'muted');
            out.feedback = { msg: 'Use docker compose up -d para subir em segundo plano.', ok: false };
            return out;
          }
          svcs.forEach(sv => {
            print(` ✔ Container app-${sv}-1  Started`);
            if (!docker.containers.some(c => c.name === `app-${sv}-1`))
              docker.containers.push({
                id: rid(),
                image: sv,
                name: `app-${sv}-1`,
                running: true,
                detached: true,
                ports: [],
                env: [],
                volumes: [],
                compose: true,
              });
          });
          docker.composeUp = true;
          return changed();
        }
        if (a[2] === 'down') {
          docker.containers = docker.containers.filter(c => !c.compose);
          svcs.forEach(sv => print(` ✔ Container app-${sv}-1  Removed`));
          docker.composeUp = false;
          return changed();
        }
        if (a[2] === 'ps') {
          print('NAME          STATUS');
          docker.containers.filter(c => c.compose).forEach(c => print(`${c.name.padEnd(14)}${c.running ? 'running' : 'exited'}`));
          return out;
        }
        return fail(`docker compose: '${a[2] || ''}' não é um comando (up -d, down, ps)`);
      }
      if (sub === 'run') {
        const c = { id: rid(), image: null, name: null, running: true, detached: false, ports: [], env: [], volumes: [] };
        for (let i = 2; i < a.length; i++) {
          const f = a[i];
          if (f === '-d' || f === '--detach') c.detached = true;
          else if (f === '--name') c.name = a[++i];
          else if (f.startsWith('--name=')) c.name = f.slice(7);
          else if (f === '-p' || f === '--publish') {
            const m = /^(\d+):(\d+)$/.exec(a[++i] || '');
            if (!m) return fail('-p precisa do formato HOST:CONTAINER, ex.: -p 8080:80');
            c.ports.push({ host: +m[1], cont: +m[2] });
          } else if (f === '-v' || f === '--volume') {
            const [src, dst] = (a[++i] || '').split(':');
            if (!dst) return fail('-v precisa do formato VOLUME:/caminho, ex.: -v dados:/var/lib/postgresql/data');
            c.volumes.push({ src, dst });
          } else if (f === '-e' || f === '--env') {
            const v = a[++i] || '';
            if (!v.includes('=')) return fail('-e precisa do formato CHAVE=valor');
            c.env.push(v);
          } else if (f === '-it' || f === '--rm') {
            /* aceitos, sem efeito */
          } else if (f.startsWith('-')) return fail(`unknown flag: ${f}. Veja help.`);
          else {
            c.image = f;
            break;
          }
        }
        if (!c.image) return fail('"docker run" requires at least 1 argument: a imagem. Ex.: docker run -d --name caixa goblin:v1');
        if (!docker.images.includes(c.image)) return fail(`Unable to find image '${c.image}' locally. Veja docker images.`);
        if (c.ports.some(p => docker.containers.some(o => o.running && o.ports.some(q => q.host === p.host))))
          return fail(`Error: Bind for 0.0.0.0:${c.ports[0].host} failed: port is already allocated.`);
        if (c.name && docker.containers.some(o => o.name === c.name))
          return fail(`Error: the container name "/${c.name}" is already in use. Use docker rm ${c.name} ou outro nome.`);
        c.name = c.name || `${['brave', 'sharp', 'quiet'][n % 3]}_${['tesla', 'lovelace', 'turing'][n++ % 3]}`;
        c.volumes.forEach(v => {
          if (!v.src.startsWith('/') && !v.src.startsWith('.') && !docker.volumes.includes(v.src)) docker.volumes.push(v.src);
        });
        if (!c.detached) {
          print(c.image.startsWith('goblin') ? '[goblin] GRRR! *quebra tudo*' : `[${c.image}] rodando em primeiro plano...`);
          print('o terminal ficou preso ao processo... (Ctrl+C)', 'muted');
          c.running = false;
          docker.containers.push(c);
          out.feedback = { msg: 'Sem -d o container roda em primeiro plano e prende seu terminal. Use -d (detached).', ok: false };
          return out;
        }
        docker.containers.push(c);
        print(c.id + rid() + rid().slice(0, 4));
        if (opts.free) {
          out.feedback = {
            msg: `Container ${c.name} criado a partir de ${c.image}${c.ports.length ? ', porta ' + c.ports[0].host : ''}. Veja com docker ps.`,
            ok: true,
          };
          return out;
        }
        return changed();
      }
      return fail(`docker: '${sub || ''}' is not a docker command. Tente help.`);
    }

    return { docker, exec };
  }

  return { create, HELP };
})();
