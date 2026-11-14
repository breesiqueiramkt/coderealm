# Guia de conteúdo

Quase tudo que o jogador aprende está em `src/content/`, separado do motor do jogo. Para adicionar conteúdo você **não precisa entender Three.js**. Depois de qualquer mudança, rode `npm test`: os testes de conteúdo apontam campo faltando, resposta fora das opções, mapa sem saída e outros erros comuns.

| Quero adicionar...                            | Arquivo                                              | Dificuldade |
| --------------------------------------------- | ---------------------------------------------------- | ----------- |
| [Minidesafio](#minidesafio)                   | `src/content/minis.js`                               | fácil       |
| [Artigo da Biblioteca](#artigo-da-biblioteca) | `src/content/library.js`                             | fácil       |
| [Item da loja](#item-da-loja)                 | `src/content/cosmetics.js` (+ desenho em `world.js`) | média       |
| [Conquista](#conquista)                       | `src/content/achievements.js`                        | fácil       |
| [Projeto real](#projeto-real)                 | `src/content/projects.js`                            | média       |
| [Fase nova](#fase-nova)                       | `src/content/phases.js` + `src/content/maps.js`      | avançada    |

## Minidesafio

Usado nos baús, no desafio do dia, na Arena e no Exame Final. Quatro formatos:

```js
// Pergunta (com ou sem código). a = índice da opção certa (começa em 0)
{ track: 'CSS', t: 'quiz', q: 'O que transforma um elemento em container flex?',
  opts: ['flex: 1;', 'display: flex;', 'position: flex;'], a: 1,
  why: 'display: flex no PAI. Os filhos diretos viram itens flexíveis.' },

// Caça ao bug: a = índice da linha errada
{ track: 'JavaScript', t: 'bug', q: 'O cofre abre com QUALQUER senha. Onde está o bug?',
  lines: ['if (senha = "1234") {', '  abrir();', '}'], a: 0,
  why: 'Um = sozinho ATRIBUI. Para comparar, use ===.' },

// Ordenar: escreva as linhas na ordem CERTA (o jogo embaralha)
{ track: 'Docker', t: 'order', q: 'Ordene o ciclo de vida.',
  lines: ['docker build -t app .', 'docker run -d --name app app', 'docker stop app'],
  why: 'Só dá para rodar o que foi construído.' },

// Completar: exatamente uma lacuna ____; respostas aceitas em minúsculas, sem espaços
{ track: 'HTML', t: 'fill', q: 'Complete o atributo do texto alternativo.',
  code: '<img src="foto.jpg" ____="Equipe">', a: ['alt'],
  why: 'alt descreve a imagem para leitores de tela.' },
```

Boas práticas: a explicação (`why`) é o que ensina; escreva-a mesmo quando a resposta parecer óbvia. Alternativas erradas devem ser enganos comuns de quem está começando, não absurdos.

## Artigo da Biblioteca

```js
{ id: 'css-variaveis', track: 'CSS', level: 2,
  title: 'Variáveis CSS (custom properties)',
  summary: 'Uma linha que aparece no card da Biblioteca.',
  body: `## Por que usar
Texto normal, **negrito** e \`código inline\`.

\`\`\`css
:root { --cor-primaria: #8b5cf6; }
.botao { background: var(--cor-primaria); }
\`\`\`

- listas com hífen
| Tabela | simples |
| --- | --- |
| a | b |` },
```

`track` precisa estar em `TRACKS` (fim do arquivo). `level` vai de 1 a 3. O corpo usa um markdown simplificado: `##`, listas, tabelas, código. Como o texto está dentro de uma _template string_, as crases precisam de barra: `` \` ``.

## Item da loja

```js
// src/content/cosmetics.js
hat: [ ..., { id: 'tiara', name: 'Tiara de LED', price: 120 } ],
// price = moedas. Use req: 'cofres' para liberar de graça ao concluir uma fase (sem compra).
```

Depois, desenhe o item em `makeCharacter()` (`src/engine/world.js`), seguindo o padrão dos chapéus existentes:

```js
if (look.hat === 'tiara') add(mesh(G.box, glowMat(0x4ade80, 1), 0.5, 0.06, 0.06), 0, 0.3, 0.18, head);
```

Cores de pele, cabelo, roupa e cachecol ficam em `PALETTES` e não precisam de código novo.

## Conquista

```js
// src/content/achievements.js
{ id: 'madrugador', icon: '🌅', name: 'Madrugador', desc: 'Jogue 14 dias seguidos.', coins: 120,
  test: () => state.daily.streak >= 14 },
```

`test()` roda sempre que algo muda (`Rewards.check()`) e paga as moedas uma única vez.

## Projeto real

Projetos da Arena são verificados **na página renderizada**: `check(doc, win)` recebe o `document` e o `window` do `iframe` de prévia e devolve `true` ou uma dica.

```js
{ id: 'galeria', track: 'CSS', level: 2, title: 'Galeria em Grid', coins: 80,
  desc: 'Três colunas em telas grandes e uma no celular.',
  starter: { html: '<div class="galeria">...</div>', css: '.galeria {\n  \n}', js: '' },
  reqs: [
    { label: '.galeria usa grid', check: (d, w) => w.getComputedStyle(d.querySelector('.galeria')).display === 'grid' || 'Use display: grid em .galeria.' },
    { label: 'Tem pelo menos 6 imagens com alt', check: d => d.querySelectorAll('.galeria img[alt]').length >= 6 || 'Coloque 6 <img> com alt.' },
  ] },
```

Dicas: valide comportamento (clique, envio de formulário, estilo final), não o texto do código. Para simular uma API, use `setup` com um `fetch` falso (veja o projeto `clima`). Projetos de arquivo (Dockerfile, compose) usam `kind: 'file2'` com `files[].rules` (veja `deploy`).

## Fase nova

Uma fase tem duas partes: o **conteúdo** (`phases.js`) e o **mapa** (`maps.js`).

### 1. Conteúdo (`src/content/phases.js`)

```js
gitignore: {
  id: 'gitignore', name: 'Muralha do Ignore', tag: 'Ferramentas', color: '#f05033',
  mentor: { name: 'Guardiã Gita', emoji: '🛡️', color: '#c0392b' },
  dialogue: [
    'O que o conceito é, numa frase.',
    'Por que ele existe (a dor que resolve).',
    'Como se usa, com um exemplo curto.',
    'O que o jogador deve fazer agora.',
  ],
  obstacleName: 'A Muralha', obstacleIntro: 'Instrução curta do desafio.',
  challenge: {
    type: 'file', filename: '.gitignore', starter: '# escreva aqui\n',
    rules: [
      { label: 'Ignora node_modules', test: ls => ls.includes('node_modules') || ls.includes('node_modules/'), hint: 'Adicione a linha node_modules/' },
      { label: 'Ignora .env', test: ls => ls.includes('.env'), hint: 'Senhas ficam no .env: ignore-o.' },
    ],
    hints: ['Uma linha por pasta ou arquivo.'],
  },
  reward: { xp: 180, item: { id: 'escudo-ignore', name: 'Escudo do Ignore', emoji: '🛡️' } },
  success: 'Frase de vitória que reforça o conceito.',
},
```

Tipos de desafio: `dragdrop`, `css`, `js`, `terminal`, `file`. Um desafio pode ter `next` com uma segunda parte (ex.: escrever o Dockerfile e depois usá-lo no terminal). Desafios de terminal usam `check(docker)` sobre o estado do simulador (`src/systems/docker-sim.js`); devolva um texto começando com `✓` para indicar "passo certo, falta o próximo".

### 2. Mapa (`src/content/maps.js`)

Grade de 15 linhas × 20 colunas. Tiles: `0` grama · `1` grama alta · `2` água · `3` caminho · `4` árvore · `5` flores · `7` rocha · `8` lava (1, 3 e 5 são andáveis; 2, 4, 7 e 8 bloqueiam).

```js
gitignore: { phase: 'gitignore', spawn: { x: 1, y: 7 }, next: 'clareira', npc: { x: 4, y: 9 }, exit: { x: 18, y: 7 },
  obstacle: { type: 'gate', cells: [{ x: 10, y: 7 }] },  // reaproveita um obstáculo animado existente
  tiles: [ /* 15 strings de 20 caracteres */ ] },
```

- Adicione o nome em `MAP_NAMES` e a fase em `MAP_ORDER` (antes de `clareira`).
- Ligue a fase anterior: o `next` dela passa a ser `'gitignore'`.
- Adicione um portal na Academia (`MAPS.academia.portals`) e reserve a célula na linha 3 com tile `3`.
- A célula (1, 6) precisa ser andável: é onde fica o portal de volta à Academia.

### 3. Rode os testes

`npm test` verifica o formato e, com uma busca em largura, que dá para chegar ao mentor, ao baú, às moedas e ao obstáculo, e que a saída **só** é alcançável depois de resolver o desafio. Depois rode `npm run test:e2e` e jogue a fase.
