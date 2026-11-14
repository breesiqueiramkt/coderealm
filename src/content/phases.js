/* =====================================================================
   CodeRealm — conteúdo das fases (teoria + desafio + validação)
   Cada fase: mapa, mentor, falas, tipo de desafio e recompensa.
   Para criar uma fase nova, copie um bloco e ajuste.
   ===================================================================== */

const PHASES = {
  // -------------------------------------------------------------- Fase 1
  vale: {
    id: 'vale',
    name: 'Vale das Tags',
    tag: 'HTML',
    color: '#ff8a3d',
    mentor: { name: 'Mentora Ada', emoji: '📚', color: '#e07a9a' },
    dialogue: [
      'Olá, aprendiz! Eu sou Ada, guardiã da Biblioteca do Vale. A ponte ali na frente desabou.',
      'Ela era feita de TAGS HTML. Uma tag é uma etiqueta que diz o que cada pedaço da página É. Quase toda tag abre e fecha: <p>texto</p>.',
      'As tags ESTRUTURAIS montam o esqueleto: <html> envolve tudo. Dentro dele, <head> guarda o que é invisível (título, links) e <body> guarda o que aparece na tela.',
      'Dentro do <body>, usamos <header> para o cabeçalho, <main> para o conteúdo principal e <footer> para o rodapé. Isso se chama SEMÂNTICA: dizer o que a coisa é.',
      'Por que importa? Navegadores, leitores de tela e o Google leem essa estrutura. Semântica certa = site acessível e bem ranqueado.',
      'Vá até a ponte e encaixe cada bloco no lugar certo. Lembre: quem fica dentro de quem?',
    ],
    obstacleName: 'A Ponte das Tags',
    obstacleIntro: 'Os blocos da ponte estão espalhados. Clique em um bloco e depois no espaço vazio onde ele deve ficar (ou arraste).',
    challenge: {
      type: 'dragdrop',
      skeleton: [
        { indent: 0, open: 's1' },
        { indent: 1, open: 's2' },
        { indent: 2, text: '<title>Vale das Tags</title>' },
        { indent: 1, close: 's2' },
        { indent: 1, open: 's3' },
        { indent: 2, open: 's4', inline: 'Ponte Norte', closeInline: 's4' },
        { indent: 2, open: 's5', inline: 'Travessia segura', closeInline: 's5' },
        { indent: 2, open: 's6', inline: 'Fim da trilha', closeInline: 's6' },
        { indent: 1, close: 's3' },
        { indent: 0, close: 's1' },
      ],
      palette: ['html', 'head', 'body', 'header', 'main', 'footer', 'div', 'span', 'h1'],
      answer: { s1: 'html', s2: 'head', s3: 'body', s4: 'header', s5: 'main', s6: 'footer' },
      hints: {
        s1: 'O bloco de fora envolve TUDO. Qual tag é a raiz de toda página?',
        s2: 'Aqui dentro só tem <title>, que é invisível. Qual tag guarda o que não aparece na tela?',
        s3: 'Tudo que aparece na tela fica aqui. Qual é a tag?',
        s4: '"Ponte Norte" é o cabeçalho da página. Tem uma tag semântica só pra isso.',
        s5: 'O conteúdo principal da página. Pense em "principal" em inglês.',
        s6: 'O rodapé. Pense em "pé" em inglês.',
      },
    },
    reward: { xp: 100, item: { id: 'manto-semantica-html', name: 'Manto da Semântica HTML', emoji: '🧥' } },
    success: 'A ponte se reconstruiu bloco a bloco. html > head + body, e dentro do body a estrutura semântica. Perfeito!',
  },

  // -------------------------------------------------------------- Fase 2
  rio: {
    id: 'rio',
    name: 'Rio Flexível',
    tag: 'CSS',
    color: '#4f8fbf',
    mentor: { name: 'Totem Flex', emoji: '🗿', color: '#9fa5a8' },
    dialogue: [
      'ZZZT... Saudações. Eu sou o Totem Flex. As plataformas do rio estão amontoadas na margem e ninguém atravessa.',
      'O HTML diz O QUE existe. O CSS diz COMO aparece. Cada elemento é uma CAIXA (Box Model): conteúdo, padding por dentro, borda, e margin por fora.',
      'Pra organizar várias caixas em linha, existe o FLEXBOX. No elemento PAI você escreve: display: flex; — e os filhos viram itens flexíveis, lado a lado.',
      'justify-content controla o espaço na horizontal: space-around ou space-evenly espalham os itens com espaço igual. align-items: center alinha na vertical.',
      'Na vida real isso é 80% dos layouts que você vai fazer: menus, cards, galerias. Dominar flex é dominar alinhamento.',
      'O rio é o pai (.rio). As plataformas são os filhos (.plataforma). Escreva o CSS e veja elas se mexerem ao vivo.',
    ],
    obstacleName: 'As Plataformas do Rio',
    obstacleIntro:
      'Edite o CSS à esquerda. O rio à direita atualiza sozinho. Quando as 4 plataformas estiverem em linha, com espaço igual e centralizadas na altura, clique em Testar.',
    challenge: {
      type: 'css',
      starter: `.rio {
  /* 1. transforme o rio em container flex */

  /* 2. espalhe as plataformas com espaço igual */

  /* 3. centralize na vertical */

}

.plataforma {
  width: 60px;
  height: 44px;
}`,
      previewHtml: `<div class="rio"><div class="plataforma"></div><div class="plataforma"></div><div class="plataforma"></div><div class="plataforma"></div></div>`,
      previewBase: `body{margin:0;background:#3f6b3f;display:grid;place-items:center;height:100vh}.rio{width:300px;height:130px;background:linear-gradient(#5fa0d0,#3f7fb0);border-radius:10px;box-shadow:inset 0 0 30px rgba(0,0,0,.25)}.plataforma{background:#b8864f;border:3px solid #7a5530;border-radius:8px;box-shadow:0 4px 0 #5a3d20}`,
      checks: [
        {
          test: s => s.rio.display === 'flex',
          hint: 'O .rio ainda não é flex. Qual propriedade transforma um elemento em container flex?',
        },
        {
          test: s => ['space-around', 'space-evenly', 'space-between'].includes(s.rio.justifyContent),
          hint: 'As plataformas estão grudadas. Use justify-content com space-around, space-evenly ou space-between.',
        },
        {
          test: s => s.rio.alignItems === 'center',
          hint: 'Elas estão na beirada de cima. Use align-items: center para centralizar na vertical.',
        },
      ],
    },
    reward: { xp: 120, item: { id: 'cinto-flexbox', name: 'Cinto do Flexbox', emoji: '🪢' } },
    success:
      'As plataformas deslizaram para o lugar e brilham azul. display: flex no pai, justify-content e align-items. Você domina o alinhamento!',
  },

  // -------------------------------------------------------------- Fase 3
  portao: {
    id: 'portao',
    name: 'Portão dos Oráculos',
    tag: 'JavaScript',
    color: '#f5c542',
    mentor: { name: 'Oráculo Lin', emoji: '🦉', color: '#c48a2a' },
    dialogue: [
      'Hoo-hoo. Eu sou Lin, a coruja de bronze. O portão ali só abre para quem sabe a senha... e sabe PROGRAMAR a pergunta.',
      'HTML é estrutura, CSS é aparência, JAVASCRIPT é comportamento: é ele que decide o que acontece.',
      'Uma VARIÁVEL é uma caixa com nome. const senha = "abracadabra"; guarda um texto na caixa "senha". Use const quando o valor não muda, let quando muda.',
      'Uma CONDICIONAL é um portão com pergunta: if (condição) { faz isso } else { faz aquilo }. A condição é algo que dá true ou false.',
      'Para comparar valores, use ===  (três iguais). "abc" === "abc" dá true. "abc" === "xyz" dá false. Nunca use = sozinho pra comparar: = é atribuição!',
      'A função abrirPortao recebe uma senha. Complete o if para que ela devolva true SÓ com a senha correta.',
    ],
    obstacleName: 'O Portão dos Oráculos',
    obstacleIntro: 'Complete a condição dentro do if. O portão vai testar sua função com várias senhas: só a correta pode abrir.',
    challenge: {
      type: 'js',
      starter: `function abrirPortao(senha) {
  const senhaCorreta = "abracadabra";

  // complete a condição abaixo
  if (            ) {
    return true;
  }

  return false;
}`,
      fnName: 'abrirPortao',
      tests: [
        { args: ['abracadabra'], expect: true, label: 'senha correta abre' },
        { args: ['errada'], expect: false, label: 'senha errada não abre' },
        { args: [''], expect: false, label: 'senha vazia não abre' },
        { args: ['ABRACADABRA'], expect: false, label: 'maiúsculas são diferentes (=== é exato)' },
      ],
      hints: ['Compare a senha recebida com senhaCorreta usando ===.', 'Fica assim: if (senha === senhaCorreta) { ... }'],
    },
    reward: { xp: 150, item: { id: 'pergaminho-condicao', name: 'Pergaminho da Condição Verdadeira', emoji: '📜' } },
    success: 'A runa ficou verde e o portão abriu em duas folhas. Variável + comparação exata + if: a base de toda lógica.',
  },

  // -------------------------------------------------------------- Fase 4
  forja: {
    id: 'forja',
    name: 'Forja dos Containers',
    tag: 'Docker',
    color: '#2496ed',
    mentor: { name: 'Mestre Kael', emoji: '🔨', color: '#b85c38' },
    dialogue: [
      'Ei, aprendiz! Cuidado! Um Goblin-Bug está solto na forja e contamina TUDO que toca. Preciso de alguém que saiba isolar.',
      'No mundo real, instalar um programa direto na máquina é como soltar o goblin: ele mexe nas configurações, conflita com outras versões e bagunça o ambiente.',
      'O DOCKER resolve isso. Uma IMAGEM é um molde: a receita pronta com tudo que o programa precisa. Um CONTAINER é a peça fundida no molde: uma cópia rodando, ISOLADA, na sua própria caixa.',
      'O comando é: docker run IMAGEM. Com -d ele roda em segundo plano (detached) e devolve seu terminal. Com --name você dá um nome pra achar depois.',
      'docker ps lista os containers rodando. docker stop NOME para um. docker images lista os moldes que você tem.',
      'Tenho a imagem goblin:v1 pronta. Prenda esse bicho num container em segundo plano chamado goblin-cage. Digite help no terminal se travar.',
    ],
    obstacleName: 'A Forja dos Containers',
    obstacleIntro: 'Use o terminal. Objetivo: rodar a imagem goblin:v1 em segundo plano, num container chamado goblin-cage.',
    challenge: {
      type: 'terminal',
      prompt: 'forja@coderealm:~$',
      images: ['goblin:v1', 'forja-base:latest'],
      goal: { image: 'goblin:v1', name: 'goblin-cage', detached: true },
    },
    reward: { xp: 200, item: { id: 'botas-container', name: 'Botas de Container Isolado', emoji: '👢' } },
    success:
      'O goblin foi sugado para uma caixa transparente que flutua sobre a forja. Imagem = molde, container = cópia isolada. A forja está limpa!',
  },
  // -------------------------------------------------------------- Fase 5
  moldes: {
    id: 'moldes',
    name: 'Oficina dos Moldes',
    tag: 'Docker',
    color: '#2496ed',
    mentor: { name: 'Mestre Kael', emoji: '🔨', color: '#b85c38' },
    dialogue: [
      'Boa, aprendiz, o goblin está preso. Mas eu só tinha a imagem goblin:v1 porque alguém me deu o molde pronto. E se precisarmos de um molde nosso?',
      'Um DOCKERFILE é a receita escrita de uma imagem. Cada linha é uma instrução, e cada instrução vira uma camada do molde.',
      'FROM escolhe a base (ex.: node:20-alpine). WORKDIR define a pasta de trabalho. COPY leva seus arquivos pra dentro. RUN executa comandos no build. CMD é o que roda quando o container sobe.',
      'Ordem importa: copie o package.json e rode npm install ANTES de copiar o resto do código. Assim, se só o código mudar, o Docker reaproveita a camada das dependências.',
      'A forja aqui tem um app Node quebrado num canto. Escreva o Dockerfile dele, depois construa a imagem com docker build -t forja-api:1.0 . e suba o container.',
      'Lembra: build cria o molde, run funde a peça.',
    ],
    obstacleName: 'A Bigorna dos Moldes',
    obstacleIntro: 'Primeiro escreva o Dockerfile (parte 1). Depois, no terminal, construa a imagem e suba o container (parte 2).',
    challenge: {
      type: 'file',
      filename: 'Dockerfile',
      starter: `# Imagem base com Node 20 (versão alpine, leve)\nFROM \n\n# Pasta de trabalho dentro da imagem\nWORKDIR /app\n\n# Copie primeiro o package.json e instale as dependências\nCOPY package*.json ./\nRUN \n\n# Agora copie o resto do código\nCOPY . .\n\n# Porta que o app usa\nEXPOSE 3000\n\n# Comando que roda quando o container sobe\nCMD `,
      rules: [
        {
          label: 'FROM com node:20-alpine',
          test: ls => ls.some(l => /^FROM\s+node:20-alpine$/i.test(l)),
          hint: 'A primeira instrução precisa ser FROM node:20-alpine.',
        },
        { label: 'WORKDIR /app', test: ls => ls.some(l => /^WORKDIR\s+\/app$/i.test(l)), hint: 'Mantenha WORKDIR /app.' },
        {
          label: 'RUN npm install (ou npm ci)',
          test: ls => ls.some(l => /^RUN\s+npm\s+(install|ci)/i.test(l)),
          hint: 'Depois de copiar o package.json, instale com RUN npm install (ou npm ci).',
        },
        {
          label: 'package.json copiado antes de COPY . .',
          test: ls => {
            const a = ls.findIndex(l => /^COPY\s+package\*?\.json/i.test(l)),
              b = ls.findIndex(l => /^COPY\s+\.\s+\.$/i.test(l));
            return a >= 0 && b > a;
          },
          hint: 'COPY package*.json ./ precisa vir ANTES de COPY . . (cache de camadas).',
        },
        {
          label: 'CMD ["node", "server.js"]',
          test: ls => ls.some(l => /^CMD\s+\[\s*"node"\s*,\s*"server\.js"\s*\]$/i.test(l)),
          hint: 'O comando final é CMD ["node", "server.js"] — formato JSON, com aspas duplas.',
        },
      ],
      hints: ['Complete os três espaços: FROM, RUN e CMD.', 'FROM node:20-alpine · RUN npm install · CMD ["node", "server.js"]'],
      next: {
        // parte 2: terminal
        type: 'terminal',
        prompt: 'oficina@coderealm:~$',
        images: ['node:20-alpine'],
        files: {
          Dockerfile:
            'FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["node", "server.js"]',
          'package.json': '{ "name": "forja-api", "main": "server.js" }',
          'server.js': 'require("http").createServer((q,r)=>r.end("forja ok")).listen(3000)',
        },
        banner:
          'Dockerfile pronto (use cat Dockerfile). Agora: docker build -t forja-api:1.0 . e depois docker run -d --name api forja-api:1.0',
        check: d => {
          if (!d.images.includes('forja-api:1.0'))
            return 'Ainda não existe a imagem forja-api:1.0. Construa com docker build -t forja-api:1.0 .';
          const c = d.containers.find(c => c.running && c.image === 'forja-api:1.0');
          if (!c) return '✓ Imagem pronta! Agora suba: docker run -d --name api forja-api:1.0';
          if (c.name !== 'api') return 'Dê o nome api ao container (--name api).';
          return true;
        },
        successLine: 'Molde próprio construído e peça fundida. Você fez sua primeira imagem!',
      },
    },
    reward: { xp: 220, item: { id: 'martelo-dockerfile', name: 'Martelo do Dockerfile', emoji: '🔨' } },
    success: 'A bigorna brilha azul e um molde novo aparece na prateleira. Dockerfile → build → imagem → run → container. Esse é o ciclo.',
  },

  // -------------------------------------------------------------- Fase 6
  portos: {
    id: 'portos',
    name: 'Porto das Conexões',
    tag: 'Docker',
    color: '#2496ed',
    mentor: { name: 'Capitã Nia', emoji: '⚓', color: '#2a7fa8' },
    dialogue: [
      'Ahoy, aprendiz! Sou Nia, capitã do porto. Temos um farol de nginx rodando num container, mas ninguém da vila consegue ver a luz.',
      'Um container é ISOLADO. Ele tem sua própria rede. A porta 80 do nginx está aberta lá dentro, mas o mundo lá fora não enxerga.',
      'Para abrir uma passagem usamos -p HOST:CONTAINER. Exemplo: -p 8080:80 significa "quem bater na porta 8080 da minha máquina cai na porta 80 do container".',
      'Variáveis de ambiente configuram o container sem mudar a imagem: -e CHAVE=valor. Senhas, modo de execução, URL do banco: tudo vai por -e.',
      'Ouça com docker logs. Se o container diz que está ouvindo na porta 80 e você não abriu a passagem, o problema é o -p.',
      'Acenda o farol: suba o nginx:latest em segundo plano, chamado farol, com a porta 8080 da vila ligada à 80 do container, e a variável FAROL_COR=azul.',
    ],
    obstacleName: 'O Farol Apagado',
    obstacleIntro:
      'Objetivo: docker run com -d, --name farol, -p 8080:80, -e FAROL_COR=azul, imagem nginx:latest. Use docker logs farol pra conferir.',
    challenge: {
      type: 'terminal',
      prompt: 'porto@coderealm:~$',
      images: ['nginx:latest', 'goblin:v1'],
      banner: 'Terminal do Porto. O farol é a imagem nginx:latest. Digite help se precisar.',
      check: d => {
        const c = d.containers.find(c => c.running && c.image === 'nginx:latest');
        if (!c) return 'Suba o nginx:latest com docker run -d ...';
        if (!c.detached) return 'Use -d.';
        if (c.name !== 'farol') return 'O container precisa se chamar farol (--name farol).';
        if (!c.ports.some(p => p.host === 8080 && p.cont === 80)) return 'A passagem está fechada. Use -p 8080:80 (host:container).';
        if (!c.env.includes('FAROL_COR=azul')) return 'Falta a variável: -e FAROL_COR=azul.';
        return true;
      },
      successLine: 'A luz atravessou a porta 8080. O farol está aceso!',
    },
    reward: { xp: 240, item: { id: 'bussola-portas', name: 'Bússola das Portas', emoji: '🧭' } },
    success:
      'Um feixe azul sai do container e varre a baía. Portas publicadas e variáveis de ambiente: é assim que o mundo fala com o container.',
  },

  // -------------------------------------------------------------- Fase 7
  cofres: {
    id: 'cofres',
    name: 'Cofre das Memórias',
    tag: 'Docker',
    color: '#2496ed',
    mentor: { name: 'Arquivista Rune', emoji: '📦', color: '#7a6a9a' },
    dialogue: [
      'Shhh. Sou Rune, o arquivista. Tenho um problema grave: cada vez que o container do banco é removido, TODOS os registros somem.',
      'Container é descartável de propósito. Tudo que ele escreve no próprio disco morre com ele. Para dados que precisam sobreviver, existe o VOLUME.',
      'Um volume é uma pasta gerenciada pelo Docker, fora do container. Você cria com docker volume create NOME e pluga com -v NOME:/caminho/dentro.',
      'Para o Postgres, o caminho é /var/lib/postgresql/data. É lá que ele guarda tudo. Plugue o volume aí e o banco sobrevive a stop, rm e run de novo.',
      'Postgres também exige uma senha por variável: -e POSTGRES_PASSWORD=algo. Sem isso ele nem sobe.',
      'Crie o volume memorias, suba postgres:16 como cofre com o volume plugado e a senha definida. Depois prove: pare, remova e suba de novo com o mesmo volume.',
    ],
    obstacleName: 'O Cofre que Esquece',
    obstacleIntro:
      'Objetivo em 2 atos: (1) docker volume create memorias; docker run -d --name cofre -e POSTGRES_PASSWORD=segredo -v memorias:/var/lib/postgresql/data postgres:16. (2) docker stop cofre; docker rm cofre; e suba de novo com o mesmo volume.',
    challenge: {
      type: 'terminal',
      prompt: 'cofre@coderealm:~$',
      images: ['postgres:16', 'nginx:latest'],
      banner: 'Terminal do Cofre. Lembre: volume → run com -v → stop → rm → run de novo.',
      check: d => {
        if (!d.volumes.includes('memorias')) return 'Crie o volume primeiro: docker volume create memorias';
        if (!d.containers.some(c => c.image === 'postgres:16'))
          return '✓ Volume criado. Agora suba o postgres:16 como cofre, com -v memorias:/var/lib/postgresql/data e -e POSTGRES_PASSWORD=...';
        const runs = d.containers.filter(c => c.image === 'postgres:16');
        const cur = runs.find(c => c.running);
        if (!cur)
          return runs.length
            ? '✓ Cofre parado. Remova (docker rm cofre) e suba de novo com o mesmo volume (-v memorias:/var/lib/postgresql/data).'
            : 'Suba o postgres:16 como cofre, com -v memorias:/var/lib/postgresql/data e -e POSTGRES_PASSWORD=...';
        if (!cur.volumes.some(v => v.src === 'memorias')) return 'O volume não está plugado. Use -v memorias:/var/lib/postgresql/data';
        if (!cur.volumes.some(v => v.dst === '/var/lib/postgresql/data'))
          return 'O caminho dentro do container precisa ser /var/lib/postgresql/data';
        if (!cur.env.some(e => e.startsWith('POSTGRES_PASSWORD='))) return 'Postgres exige -e POSTGRES_PASSWORD=algumacoisa';
        d.cycles = d.cycles || 0;
        if (!cur._counted) {
          cur._counted = true;
          d.cycles++;
        }
        if (d.cycles < 2)
          return '✓ Cofre no ar com volume! Agora prove que os dados sobrevivem: docker stop cofre, docker rm cofre, e suba de novo com o mesmo -v.';
        return true;
      },
      successLine: 'O cofre renasceu com todas as memórias intactas.',
    },
    reward: { xp: 260, item: { id: 'chave-volumes', name: 'Chave dos Volumes', emoji: '🗝️' } },
    success: 'As prateleiras se enchem de novo sozinhas. O container morreu duas vezes; os dados, nenhuma. Isso é volume.',
  },

  // -------------------------------------------------------------- Fase 8
  orquestra: {
    id: 'orquestra',
    name: 'Torre da Orquestra',
    tag: 'Docker',
    color: '#2496ed',
    mentor: { name: 'Maestrina Vela', emoji: '🎼', color: '#c4a030' },
    dialogue: [
      'Bem-vindo à torre, aprendiz. Você já sabe subir um container de cada vez. Mas um sistema de verdade tem API, banco, cache... subir tudo na mão é um pesadelo.',
      'O DOCKER COMPOSE descreve todos os serviços num arquivo YAML. Um comando sobe tudo, com rede, volumes e ordem.',
      'No docker-compose.yml, cada serviço é um nome sob services:. Dentro dele: image (ou build), ports, environment, volumes, depends_on.',
      'Os serviços se enxergam pelo NOME. A API acessa o banco em db:5432, não em localhost. Essa é a mágica da rede do compose.',
      'Volumes nomeados são declarados no fim, em volumes:. Indentação em YAML é com 2 espaços e é sagrada.',
      'Escreva o compose com api (build .) na porta 3000 e db (postgres:16) com volume. Depois suba a orquestra com docker compose up -d.',
    ],
    obstacleName: 'A Partitura Vazia',
    obstacleIntro: 'Parte 1: complete o docker-compose.yml. Parte 2: suba tudo com docker compose up -d.',
    challenge: {
      type: 'file',
      filename: 'docker-compose.yml',
      starter: `services:\n  api:\n    build: .\n    ports:\n      - "3000:3000"\n    environment:\n      DATABASE_URL: postgres://app:senha@____:5432/app\n    depends_on:\n      - ____\n\n  db:\n    image: ____\n    environment:\n      POSTGRES_USER: app\n      POSTGRES_PASSWORD: senha\n      POSTGRES_DB: app\n    volumes:\n      - dados:/var/lib/postgresql/data\n\nvolumes:\n  ____:\n`,
      rules: [
        {
          label: 'api com build: . e porta 3000',
          test: (ls, raw) => /api:\s*\n\s+build:\s*\./.test(raw) && /"3000:3000"/.test(raw),
          hint: 'Mantenha build: . e ports "3000:3000" no serviço api.',
        },
        {
          label: 'DATABASE_URL aponta para db (nome do serviço)',
          test: (ls, raw) => /@db:5432/.test(raw),
          hint: 'Dentro do compose, a API acha o banco pelo nome do serviço: @db:5432, não localhost.',
        },
        { label: 'depends_on: db', test: (ls, raw) => /depends_on:\s*\n\s+-\s*db\b/.test(raw), hint: 'depends_on precisa listar - db.' },
        {
          label: 'db usa image: postgres:16',
          test: (ls, raw) => /db:\s*\n\s+image:\s*postgres:16/.test(raw),
          hint: 'O serviço db usa image: postgres:16.',
        },
        {
          label: 'volume dados declarado no fim',
          test: (ls, raw) => /^volumes:\s*\n\s+dados:/m.test(raw),
          hint: 'No fim do arquivo, em volumes:, declare dados: (o mesmo nome usado no serviço db).',
        },
      ],
      hints: [
        'Troque os quatro ____: db, db, postgres:16 e dados.',
        'A API fala com o banco pelo nome do serviço (db). O volume usado em db precisa ser declarado em volumes: no fim.',
      ],
      next: {
        type: 'terminal',
        prompt: 'torre@coderealm:~$',
        images: ['postgres:16'],
        files: {
          'docker-compose.yml':
            'services:\n  api:\n    build: .\n    ports:\n      - "3000:3000"\n    depends_on:\n      - db\n\n  db:\n    image: postgres:16\n    volumes:\n      - dados:/var/lib/postgresql/data\n\nvolumes:\n  dados:',
          Dockerfile: 'FROM node:20-alpine\nWORKDIR /app\nCOPY . .\nCMD ["node", "server.js"]',
        },
        banner: 'Partitura pronta (cat docker-compose.yml). Suba a orquestra: docker compose up -d. Depois veja com docker compose ps.',
        check: d => (d.composeUp ? true : 'Suba os serviços com docker compose up -d'),
        successLine: 'api e db subiram juntos, na mesma rede, com um único comando.',
      },
    },
    reward: { xp: 300, item: { id: 'batuta-compose', name: 'Batuta do Compose', emoji: '🎼' } },
    success:
      'A torre inteira acende, andar por andar: api, db, volume, rede. Você rege um sistema completo com um comando. Parabéns, Orquestrador!',
  },
};
