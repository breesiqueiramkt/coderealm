/* =====================================================================
   CodeRealm — Projetos reais da Arena
   Cada projeto é um mini-site de verdade construído no playground, com
   requisitos verificados no DOM renderizado (não no texto do código).
   check(doc, win) recebe o documento do preview e devolve true ou dica.
   ===================================================================== */

const PROJECTS = [
  {
    id: 'cartao',
    track: 'HTML',
    level: 1,
    title: 'Cartão de visita',
    coins: 40,
    desc: 'Sua primeira página de verdade: um cartão com nome, cargo, foto e link. Só HTML e CSS.',
    starter: {
      html: `<!-- Monte seu cartão aqui -->\n<div class="cartao">\n\n</div>`,
      css: `body { font-family: sans-serif; background: #f0ebe3; display: grid; place-items: center; min-height: 100vh; margin: 0; }\n.cartao {\n  /* estilize o cartão */\n}`,
      js: ``,
    },
    reqs: [
      {
        label: 'Um <h1> com o nome',
        check: d =>
          (d.querySelector('.cartao h1') && d.querySelector('.cartao h1').textContent.trim().length > 1) ||
          'Coloque um <h1> com o seu nome dentro de .cartao.',
      },
      {
        label: 'Um <p> com o cargo ou curso',
        check: d =>
          (d.querySelector('.cartao p') && d.querySelector('.cartao p').textContent.trim().length > 2) ||
          'Adicione um <p> com seu cargo ou curso.',
      },
      {
        label: 'Uma <img> com alt',
        check: d => {
          const i = d.querySelector('.cartao img');
          return i
            ? (i.getAttribute('alt') || '').length > 0 || 'A imagem precisa de alt descritivo.'
            : 'Coloque uma <img> (pode usar src="https://placehold.co/120").';
        },
      },
      {
        label: 'Um link <a> com href que abre em nova aba',
        check: d => {
          const a = d.querySelector('.cartao a[href]');
          return a ? a.getAttribute('target') === '_blank' || 'Adicione target="_blank" no link.' : 'Falta um <a href="..."> no cartão.';
        },
      },
      {
        label: '.cartao tem fundo, padding e cantos arredondados',
        check: (d, w) => {
          const s = w.getComputedStyle(d.querySelector('.cartao'));
          return (
            (parseFloat(s.paddingTop) >= 8 && parseFloat(s.borderTopLeftRadius) >= 4 && s.backgroundColor !== 'rgba(0, 0, 0, 0)') ||
            'No CSS de .cartao: background, padding e border-radius.'
          );
        },
      },
    ],
  },
  {
    id: 'menu',
    track: 'CSS',
    level: 2,
    title: 'Menu de navegação',
    coins: 60,
    desc: 'Um cabeçalho com logo à esquerda e links à direita, alinhados com Flexbox. É o topo de 90% dos sites.',
    starter: {
      html: `<header class="topo">\n  <a class="logo" href="#">BsCode</a>\n  <nav>\n    <ul>\n      <li><a href="#">Início</a></li>\n      <li><a href="#">Projetos</a></li>\n      <li><a href="#">Contato</a></li>\n    </ul>\n  </nav>\n</header>\n<main><h1>Bem-vindo</h1></main>`,
      css: `body { margin: 0; font-family: sans-serif; }\n.topo {\n  /* 1. flex, espaço entre logo e nav, alinhado ao centro */\n  padding: 12px 24px;\n  background: #1a1626;\n}\n.topo a { color: #fff; text-decoration: none; }\n.logo { font-weight: 900; font-size: 20px; }\nnav ul {\n  /* 2. tire as bolinhas e coloque os itens em linha com espaço */\n}`,
      js: ``,
    },
    reqs: [
      {
        label: '.topo é flex com space-between',
        check: (d, w) => {
          const s = w.getComputedStyle(d.querySelector('.topo'));
          return (
            (s.display === 'flex' && s.justifyContent === 'space-between') ||
            '.topo precisa de display: flex e justify-content: space-between.'
          );
        },
      },
      {
        label: '.topo alinha ao centro na vertical',
        check: (d, w) => w.getComputedStyle(d.querySelector('.topo')).alignItems === 'center' || 'align-items: center em .topo.',
      },
      {
        label: 'A lista está em linha, sem marcadores',
        check: (d, w) => {
          const s = w.getComputedStyle(d.querySelector('nav ul'));
          return (s.display === 'flex' && s.listStyleType === 'none') || 'nav ul precisa de display: flex e list-style: none.';
        },
      },
      {
        label: 'Há espaço entre os links (gap ≥ 12px)',
        check: (d, w) => parseFloat(w.getComputedStyle(d.querySelector('nav ul')).columnGap) >= 12 || 'Use gap: 16px (ou mais) em nav ul.',
      },
      {
        label: 'Padding da lista zerado',
        check: (d, w) =>
          parseFloat(w.getComputedStyle(d.querySelector('nav ul')).paddingLeft) === 0 ||
          'A ul vem com padding-left padrão. Zere com padding: 0.',
      },
    ],
  },
  {
    id: 'contador',
    track: 'JavaScript',
    level: 2,
    title: 'Contador interativo',
    coins: 70,
    desc: 'Botões de + e − que mudam um número na tela, e o número fica vermelho quando é negativo. DOM e eventos na prática.',
    starter: {
      html: `<div class="contador">\n  <button id="menos">−</button>\n  <span id="valor">0</span>\n  <button id="mais">+</button>\n</div>`,
      css: `body { font-family: sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; }\n.contador { display: flex; gap: 16px; align-items: center; font-size: 32px; }\nbutton { font-size: 24px; width: 48px; height: 48px; border-radius: 12px; border: 0; background: #f5c542; cursor: pointer; }\n.negativo { color: #e05a5a; }`,
      js: `// 1. selecione os três elementos\n\n// 2. crie uma variável para o valor\n\n// 3. ao clicar em + ou −, mude o valor, atualize o texto\n//    e adicione/remova a classe "negativo" quando for < 0\n`,
    },
    setup: '',
    reqs: [
      {
        label: 'Clicar em + aumenta o valor',
        check: d => {
          const v = d.getElementById('valor');
          v.textContent = '0';
          d.getElementById('mais').click();
          return v.textContent.trim() === '1' || 'Depois de um clique em +, #valor deve mostrar 1.';
        },
      },
      {
        label: 'Clicar em − diminui o valor',
        check: d => {
          const v = d.getElementById('valor'),
            before = Number(v.textContent);
          d.getElementById('menos').click();
          return Number(v.textContent) === before - 1 || 'Cada clique em − deve diminuir 1.';
        },
      },
      {
        label: 'Valor negativo ganha a classe "negativo"',
        check: d => {
          const v = d.getElementById('valor');
          let n = 0;
          while (Number(v.textContent) > -1 && n++ < 10) d.getElementById('menos').click();
          return (
            v.classList.contains('negativo') || 'Quando o valor for menor que 0, adicione a classe negativo em #valor (classList.add).'
          );
        },
      },
      {
        label: 'Voltando a ≥ 0 a classe some',
        check: d => {
          const v = d.getElementById('valor');
          let n = 0;
          while (Number(v.textContent) < 0 && n++ < 20) d.getElementById('mais').click();
          return !v.classList.contains('negativo') || 'Quando voltar a 0 ou mais, remova a classe (classList.remove ou toggle).';
        },
      },
    ],
  },
  {
    id: 'tarefas',
    track: 'JavaScript',
    level: 3,
    title: 'Lista de tarefas',
    coins: 100,
    desc: 'O clássico: digitar, adicionar, marcar como feita e contar quantas faltam. Formulário, arrays e DOM juntos.',
    starter: {
      html: `<form id="form">\n  <input id="texto" placeholder="Nova tarefa" autocomplete="off">\n  <button>Adicionar</button>\n</form>\n<ul id="lista"></ul>\n<p>Faltam: <strong id="faltam">0</strong></p>`,
      css: `body { font-family: sans-serif; max-width: 420px; margin: 40px auto; }\n#form { display: flex; gap: 8px; }\n#texto { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #ccc; }\nbutton { padding: 10px 14px; border-radius: 8px; border: 0; background: #8b5cf6; color: #fff; cursor: pointer; }\n#lista { list-style: none; padding: 0; }\n#lista li { padding: 10px; border-bottom: 1px solid #eee; cursor: pointer; }\n#lista li.feita { text-decoration: line-through; opacity: .5; }`,
      js: `const form = document.getElementById("form");\nconst input = document.getElementById("texto");\nconst lista = document.getElementById("lista");\nconst faltam = document.getElementById("faltam");\n\n// 1. no submit do form: e.preventDefault(), criar um <li> com o texto,\n//    adicionar em #lista, limpar o input e atualizar o contador\n\n// 2. ao clicar num <li>: alternar a classe "feita" e atualizar o contador\n\n// 3. o contador mostra quantos <li> NÃO têm a classe "feita"\n`,
    },
    reqs: [
      {
        label: 'Enviar o formulário cria um <li> com o texto',
        check: d => {
          const i = d.getElementById('texto');
          i.value = 'Estudar Docker';
          d.getElementById('form').requestSubmit();
          const li = d.querySelector('#lista li');
          return (
            (li && li.textContent.includes('Estudar Docker')) ||
            'No submit, crie um li com o texto digitado e coloque em #lista. Lembre do e.preventDefault().'
          );
        },
      },
      {
        label: 'O input é limpo depois de adicionar',
        check: d => d.getElementById('texto').value === '' || 'Depois de adicionar, faça input.value = "".',
      },
      {
        label: 'Clicar no item marca como feita',
        check: d => {
          const li = d.querySelector('#lista li');
          li.click();
          return li.classList.contains('feita') || 'No clique do li, use classList.toggle("feita").';
        },
      },
      {
        label: 'O contador mostra quantas faltam',
        check: d => {
          const i = d.getElementById('texto');
          i.value = 'Outra';
          d.getElementById('form').requestSubmit();
          return (
            d.getElementById('faltam').textContent.trim() === '1' ||
            'Com 2 tarefas e 1 feita, #faltam deve mostrar 1. Conte os li sem a classe feita.'
          );
        },
      },
      {
        label: 'Texto vazio não cria item',
        check: d => {
          const n = d.querySelectorAll('#lista li').length;
          d.getElementById('texto').value = '   ';
          d.getElementById('form').requestSubmit();
          return d.querySelectorAll('#lista li').length === n || 'Ignore envios com texto vazio (use .trim()).';
        },
      },
    ],
  },
  {
    id: 'clima',
    track: 'JavaScript',
    level: 3,
    title: 'Painel de clima (fetch)',
    coins: 120,
    desc: 'Buscar dados de uma API com fetch e async/await e mostrar na tela, com tratamento de erro. Aqui a API é simulada para funcionar offline.',
    starter: {
      html: `<button id="buscar">Buscar clima</button>\n<div id="painel">Clique para carregar.</div>`,
      css: `body { font-family: sans-serif; max-width: 420px; margin: 40px auto; }\n#painel { margin-top: 16px; padding: 16px; border-radius: 12px; background: #e7f1fb; }\n.erro { background: #fbebeb; color: #b91c1c; }`,
      js: `// A função fetch já está "mockada": fetch("/api/clima") responde\n// { cidade: "Jacareí", temp: 27, condicao: "ensolarado" } em ~300ms.\n// fetch("/api/erro") devolve status 500.\n\nconst botao = document.getElementById("buscar");\nconst painel = document.getElementById("painel");\n\nasync function carregar() {\n  // 1. mostre "Carregando..." no painel\n  // 2. await fetch("/api/clima"), confira resposta.ok, await .json()\n  // 3. mostre "Jacareí: 27°C, ensolarado" no painel\n  // 4. em caso de erro (try/catch), mostre a mensagem e adicione a classe "erro"\n}\n\nbotao.addEventListener("click", carregar);\n`,
    },
    setup: `window.__realFetch = window.fetch; window.fetch = (url) => new Promise((res, rej) => setTimeout(() => { if (String(url).includes('/api/clima')) res({ ok: true, status: 200, json: async () => ({ cidade: 'Jacareí', temp: 27, condicao: 'ensolarado' }) }); else if (String(url).includes('/api/erro')) res({ ok: false, status: 500, json: async () => ({}) }); else rej(new TypeError('Failed to fetch')); }, 300));`,
    async: true,
    reqs: [
      {
        label: 'Mostra "Carregando" enquanto busca',
        check: async d => {
          d.getElementById('buscar').click();
          await new Promise(r => setTimeout(r, 50));
          return /carregando/i.test(d.getElementById('painel').textContent) || 'Antes do await, escreva "Carregando..." no painel.';
        },
      },
      {
        label: 'Mostra cidade, temperatura e condição',
        check: async d => {
          await new Promise(r => setTimeout(r, 600));
          const t = d.getElementById('painel').textContent;
          return (
            (/Jacare/.test(t) && /27/.test(t) && /ensolarado/.test(t)) ||
            'Depois do await resposta.json(), monte o texto com cidade, temp e condicao.'
          );
        },
      },
      {
        label: 'Trata erro da API (status 500)',
        check: async (d, w) => {
          const orig = w.fetch;
          w.fetch = u => orig('/api/erro');
          d.getElementById('buscar').click();
          await new Promise(r => setTimeout(r, 600));
          w.fetch = orig;
          const p = d.getElementById('painel');
          return (
            p.classList.contains('erro') ||
            'Se !resposta.ok, lance um Error. No catch, adicione a classe erro ao painel e mostre a mensagem.'
          );
        },
      },
    ],
  },
  {
    id: 'deploy',
    track: 'Docker',
    level: 3,
    title: 'Empacotar o site',
    coins: 90,
    desc: 'Escreva o Dockerfile que serve seu site estático com nginx e o compose que sobe o site mais um banco. É o deploy real de um projeto da faculdade.',
    kind: 'file2',
    files: [
      {
        name: 'Dockerfile',
        starter: `# Imagem base: servidor web leve\nFROM \n\n# Copie a pasta site/ para onde o nginx serve os arquivos\nCOPY site/ \n\nEXPOSE 80\n`,
        rules: [
          {
            label: 'FROM nginx:alpine (ou nginx:latest)',
            test: ls => ls.some(l => /^FROM\s+nginx(:alpine|:latest)?$/i.test(l)),
            hint: 'Use FROM nginx:alpine.',
          },
          {
            label: 'COPY site/ para /usr/share/nginx/html',
            test: ls => ls.some(l => /^COPY\s+\.?\/?site\/?\s+\/usr\/share\/nginx\/html\/?$/i.test(l)),
            hint: 'O nginx serve a pasta /usr/share/nginx/html. Então: COPY site/ /usr/share/nginx/html',
          },
          { label: 'EXPOSE 80', test: ls => ls.some(l => /^EXPOSE\s+80$/i.test(l)), hint: 'Mantenha EXPOSE 80.' },
        ],
      },
      {
        name: 'docker-compose.yml',
        starter: `services:\n  site:\n    build: .\n    ports:\n      - "____:80"\n\n  db:\n    image: ____\n    environment:\n      POSTGRES_PASSWORD: segredo\n    volumes:\n      - ____:/var/lib/postgresql/data\n\nvolumes:\n  dados:\n`,
        rules: [
          { label: 'site publica a porta 8080 → 80', test: (ls, raw) => /"8080:80"/.test(raw), hint: 'ports do site: "8080:80".' },
          { label: 'db usa postgres:16', test: (ls, raw) => /image:\s*postgres:16/.test(raw), hint: 'image: postgres:16 no serviço db.' },
          {
            label: 'db usa o volume dados',
            test: (ls, raw) => /-\s*dados:\/var\/lib\/postgresql\/data/.test(raw),
            hint: 'volumes do db: - dados:/var/lib/postgresql/data (o mesmo nome declarado no fim).',
          },
        ],
      },
    ],
  },
];
