/* Simulador de Docker: comandos, mensagens de erro parecidas com as reais e o objetivo de cada fase.
   Também resolve as fases de terminal (4, 5-parte 2, 6, 7, 8-parte 2) com os comandos do gabarito. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadScripts } = require('../helpers/load');

const g = loadScripts(['src/content/phases.js', 'src/systems/docker-sim.js'], ['DockerSim', 'PHASES']);
const sim = (opts = {}) => g.DockerSim.create({ images: ['nginx:latest', 'postgres:16'], free: true, ...opts });
const text = r => r.lines.map(l => l.text).join('\n');

describe('comandos básicos', () => {
  test('help lista os comandos; comando desconhecido explica', () => {
    const s = sim();
    assert.match(text(s.exec('help')), /docker run/);
    assert.match(text(s.exec('git status')), /comando não encontrado/);
    assert.match(text(s.exec('docker voar')), /is not a docker command/);
  });
  test('run -d cria container rodando, com nome e porta', () => {
    const s = sim();
    s.exec('docker run -d --name web -p 8080:80 nginx:latest');
    const c = s.docker.containers[0];
    assert.equal(c.name, 'web');
    assert.equal(c.running, true);
    assert.equal(c.detached, true);
    assert.deepEqual(
      Array.from(c.ports, p => `${p.host}:${p.cont}`),
      ['8080:80'],
    );
    assert.match(text(s.exec('docker ps')), /0\.0\.0\.0:8080->80\/tcp\s+web/);
  });
  test('sem -d o terminal "trava" e o jogo explica', () => {
    const r = sim().exec('docker run nginx:latest');
    assert.match(r.feedback.msg, /-d/);
  });
  test('imagem que não existe', () => assert.match(text(sim().exec('docker run -d redis')), /Unable to find image 'redis'/));
  test('porta ocupada e nome repetido dão o mesmo erro do Docker real', () => {
    const s = sim();
    s.exec('docker run -d --name a -p 8080:80 nginx:latest');
    assert.match(text(s.exec('docker run -d --name b -p 8080:80 nginx:latest')), /port is already allocated/);
    assert.match(text(s.exec('docker run -d --name a nginx:latest')), /already in use/);
  });
  test('formato errado de -p, -v e -e', () => {
    const s = sim();
    assert.match(text(s.exec('docker run -d -p 8080 nginx:latest')), /HOST:CONTAINER/);
    assert.match(text(s.exec('docker run -d -v dados nginx:latest')), /VOLUME:\/caminho/);
    assert.match(text(s.exec('docker run -d -e SENHA nginx:latest')), /CHAVE=valor/);
  });
  test('não remove container rodando sem parar antes (ou -f)', () => {
    const s = sim();
    s.exec('docker run -d --name web nginx:latest');
    assert.match(text(s.exec('docker rm web')), /cannot remove a running container/);
    s.exec('docker stop web');
    s.exec('docker rm web');
    assert.equal(s.docker.containers.length, 0);
    s.exec('docker run -d --name web2 nginx:latest');
    s.exec('docker rm -f web2');
    assert.equal(s.docker.containers.length, 0);
  });
  test('volume: create, ls e criação automática no run', () => {
    const s = sim();
    s.exec('docker volume create dados');
    s.exec('docker run -d --name db -e POSTGRES_PASSWORD=x -v outro:/var/lib/postgresql/data postgres:16');
    assert.deepEqual(Array.from(s.docker.volumes), ['dados', 'outro']);
    assert.match(text(s.exec('docker volume ls')), /local\s+dados/);
  });
  test('build exige -t, o "." e um Dockerfile', () => {
    assert.match(text(sim().exec('docker build -t app:1 .')), /Dockerfile not found/);
    const s = sim({ files: { Dockerfile: 'FROM nginx:alpine' } });
    assert.match(text(s.exec('docker build .')), /-t/);
    assert.match(text(s.exec('docker build -t app:1')), /contexto/);
    s.exec('docker build -t app:1 .');
    assert.ok(s.docker.images.includes('app:1'));
  });
  test('compose up -d sobe os serviços do arquivo; down derruba', () => {
    const s = sim({ files: { 'docker-compose.yml': 'services:\n  api:\n    build: .\n  db:\n    image: postgres:16\n' } });
    assert.match(s.exec('docker compose up').feedback.msg, /-d/);
    s.exec('docker compose up -d');
    assert.deepEqual(
      Array.from(s.docker.containers, c => c.name),
      ['app-api-1', 'app-db-1'],
    );
    s.exec('docker compose down');
    assert.equal(s.docker.containers.length, 0);
  });
  test('ls, cat e clear', () => {
    const s = sim({ files: { 'a.txt': 'oi' } });
    assert.match(text(s.exec('ls')), /a\.txt/);
    assert.equal(text(s.exec('cat a.txt')), 'oi');
    assert.equal(s.exec('clear').clear, true);
  });
});

describe('fases de terminal resolvidas com o gabarito', () => {
  const phaseSim = ch =>
    g.DockerSim.create({ images: ch.images, files: ch.files, goal: ch.goal, check: ch.check, successLine: ch.successLine });

  test('fase 4 (Forja): o nome errado ainda não resolve; o certo resolve', () => {
    const s = phaseSim(g.PHASES.forja.challenge);
    assert.equal(s.exec('docker run -d goblin:v1').solved, false);
    assert.equal(s.exec('docker run -d --name goblin-cage goblin:v1').solved, true);
  });
  test('fase 5 parte 2 (Oficina): build e depois run', () => {
    const s = phaseSim(g.PHASES.moldes.challenge.next);
    assert.match(s.exec('docker run -d --name api forja-api:1.0').lines[0].text, /Unable to find image/);
    const b = s.exec('docker build -t forja-api:1.0 .');
    assert.equal(b.solved, false);
    assert.equal(b.feedback.ok, true, 'passo certo aparece como progresso, não como erro');
    assert.equal(s.exec('docker run -d --name api forja-api:1.0').solved, true);
  });
  test('fase 6 (Porto): porta e variável obrigatórias', () => {
    const s = phaseSim(g.PHASES.portos.challenge);
    assert.match(s.exec('docker run -d --name farol nginx:latest').feedback.msg, /-p 8080:80/);
    s.exec('docker rm -f farol');
    assert.match(s.exec('docker run -d --name farol -p 8080:80 nginx:latest').feedback.msg, /FAROL_COR/);
    s.exec('docker rm -f farol');
    assert.equal(s.exec('docker run -d --name farol -p 8080:80 -e FAROL_COR=azul nginx:latest').solved, true);
  });
  test('fase 7 (Cofre): só resolve depois de provar que o volume sobrevive', () => {
    const s = phaseSim(g.PHASES.cofres.challenge);
    const RUN = 'docker run -d --name cofre -e POSTGRES_PASSWORD=segredo -v memorias:/var/lib/postgresql/data postgres:16';
    assert.equal(s.exec('docker volume create memorias').solved, false);
    assert.equal(s.exec(RUN).solved, false, 'primeira subida ainda não prova persistência');
    s.exec('docker stop cofre');
    s.exec('docker rm cofre');
    assert.equal(s.exec(RUN).solved, true);
  });
  test('fase 8 parte 2 (Torre): compose up -d', () => {
    const s = phaseSim(g.PHASES.orquestra.challenge.next);
    assert.equal(s.exec('docker compose up -d').solved, true);
  });
});

describe('fases de arquivo: o gabarito passa e o arquivo inicial não', () => {
  const lines = raw =>
    raw
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'));
  const passes = (ch, raw) => ch.rules.every(r => r.test(lines(raw), raw));
  test('fase 5 parte 1: Dockerfile', () => {
    const ch = g.PHASES.moldes.challenge;
    assert.equal(passes(ch, ch.starter), false);
    assert.equal(
      passes(
        ch,
        'FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["node", "server.js"]',
      ),
      true,
    );
    assert.equal(
      passes(ch, 'FROM node:20-alpine\nWORKDIR /app\nCOPY . .\nCOPY package*.json ./\nRUN npm install\nCMD ["node", "server.js"]'),
      false,
      'ordem errada das camadas deve falhar',
    );
  });
  test('fase 8 parte 1: docker-compose.yml', () => {
    const ch = g.PHASES.orquestra.challenge;
    assert.equal(passes(ch, ch.starter), false);
    const ok = ch.starter
      .replace('@____:', '@db:')
      .replace('- ____', '- db')
      .replace('image: ____', 'image: postgres:16')
      .replace('  ____:', '  dados:');
    assert.equal(passes(ch, ok), true);
    assert.equal(passes(ch, ok.replace('@db:', '@localhost:')), false, 'localhost dentro do compose deve falhar');
  });
});
