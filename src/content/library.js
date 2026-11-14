/* =====================================================================
   CodeRealm — Biblioteca de estudos
   Cada artigo: id, trilha, nível, título, resumo e corpo em markdown-lite
   (## título, ``` código, **negrito**, `inline`, listas com -).
   Para adicionar material: copie um objeto e escreva.
   ===================================================================== */

const LIBRARY = [
  // ===================================================== HTML
  {
    id: 'html-oque',
    track: 'HTML',
    level: 1,
    title: 'O que é HTML e como uma página é montada',
    summary: 'Tags, elementos, atributos e o esqueleto mínimo de toda página.',
    body: `## HTML é estrutura
HTML (HyperText Markup Language) descreve **o que existe** numa página: títulos, parágrafos, imagens, links. Ele não cuida da aparência (CSS) nem do comportamento (JavaScript).

## Tag, elemento e atributo
- **Tag**: a etiqueta entre < e >. Quase toda tag abre e fecha: \`<p>\` ... \`</p>\`.
- **Elemento**: a tag de abertura + conteúdo + tag de fechamento.
- **Atributo**: informação extra dentro da tag de abertura: \`<a href="https://fatec.sp.gov.br">\`.

\`\`\`html
<a href="https://exemplo.com" target="_blank">Abrir site</a>
<img src="foto.jpg" alt="Descrição da foto">
\`\`\`

Algumas tags não têm fechamento (vazias): \`<img>\`, \`<br>\`, \`<input>\`, \`<meta>\`.

## O esqueleto mínimo
\`\`\`html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <title>Minha página</title>
  </head>
  <body>
    <h1>Olá, mundo</h1>
  </body>
</html>
\`\`\`
- \`<!DOCTYPE html>\` diz ao navegador que é HTML5.
- \`<head>\` guarda o que não aparece: título da aba, charset, links de CSS.
- \`<body>\` guarda tudo que aparece.

**Erro clássico**: colocar \`<head>\` dentro de \`<body>\`. Eles são irmãos, filhos diretos de \`<html>\`.`,
  },

  {
    id: 'html-semantica',
    track: 'HTML',
    level: 1,
    title: 'Tags semânticas: header, main, footer, nav, section, article',
    summary: 'Por que usar tags que dizem o que a coisa é, em vez de div pra tudo.',
    body: `## Div não diz nada
\`<div>\` é uma caixa genérica. Funciona, mas não conta ao navegador, ao leitor de tela nem ao Google o que tem ali dentro.

## As tags semânticas
| Tag | Uso |
| --- | --- |
| \`<header>\` | Cabeçalho da página ou de uma seção (logo, título) |
| \`<nav>\` | Bloco de links de navegação |
| \`<main>\` | Conteúdo principal. Só UM por página |
| \`<section>\` | Uma seção temática com título próprio |
| \`<article>\` | Conteúdo independente (post, notícia, card) |
| \`<aside>\` | Conteúdo lateral (relacionados, anúncios) |
| \`<footer>\` | Rodapé (contato, copyright) |

\`\`\`html
<body>
  <header><h1>BsCode</h1><nav><a href="#">Serviços</a></nav></header>
  <main>
    <section>
      <h2>Projetos</h2>
      <article><h3>App da barbearia</h3><p>...</p></article>
    </section>
  </main>
  <footer><p>© 2026</p></footer>
</body>
\`\`\`

## Por que importa de verdade
1. **Acessibilidade**: leitores de tela pulam direto para \`<main>\` ou \`<nav>\`.
2. **SEO**: o Google entende melhor a hierarquia do conteúdo.
3. **Manutenção**: você abre o código de outra pessoa e entende o layout sem ler o CSS.`,
  },

  {
    id: 'html-forms',
    track: 'HTML',
    level: 2,
    title: 'Formulários: input, label, select, button',
    summary: 'Como capturar dados do usuário e o que cada tipo de input faz.',
    body: `## O básico
\`\`\`html
<form action="/cadastro" method="post">
  <label for="nome">Nome</label>
  <input id="nome" name="nome" type="text" required>

  <label for="email">E-mail</label>
  <input id="email" name="email" type="email" required>

  <label for="plano">Plano</label>
  <select id="plano" name="plano">
    <option value="basico">Básico</option>
    <option value="pro">Pro</option>
  </select>

  <button type="submit">Enviar</button>
</form>
\`\`\`

## Regras que evitam dor de cabeça
- Todo \`<input>\` tem um \`<label for="id">\`. Clicar no label foca o campo e o leitor de tela sabe o que é.
- \`name\` é o que vai para o servidor. Sem \`name\`, o campo não é enviado.
- \`type\` muda o teclado no celular e a validação: \`email\`, \`number\`, \`date\`, \`password\`, \`tel\`.
- \`required\`, \`min\`, \`max\`, \`pattern\` validam no navegador antes de enviar.

## Tipos úteis
\`checkbox\` (vários), \`radio\` (um só, mesmo \`name\`), \`textarea\` (texto longo), \`file\` (upload), \`range\` (slider), \`color\`.`,
  },

  {
    id: 'html-tabelas-listas',
    track: 'HTML',
    level: 2,
    title: 'Listas, tabelas e imagens responsivas',
    summary: 'ul/ol, table com thead/tbody e a tag picture.',
    body: `## Listas
\`\`\`html
<ul><li>Sem ordem</li><li>Bolinhas</li></ul>
<ol><li>Com ordem</li><li>Números</li></ol>
\`\`\`
Menus de navegação quase sempre são \`<ul>\` com \`<a>\` dentro de cada \`<li>\`.

## Tabelas (só para dados tabulares)
\`\`\`html
<table>
  <thead><tr><th>Produto</th><th>Preço</th></tr></thead>
  <tbody><tr><td>Camiseta</td><td>R$ 49,90</td></tr></tbody>
</table>
\`\`\`
Nunca use tabela para layout. Para isso existe Flexbox e Grid.

## Imagens
\`\`\`html
<img src="foto.jpg" alt="Equipe no escritório" width="800" height="600" loading="lazy">
\`\`\`
- \`alt\` é obrigatório: descreve a imagem para quem não vê e aparece se ela falhar.
- \`width\`/\`height\` evitam o layout pular enquanto carrega.
- \`loading="lazy"\` só baixa quando chega perto da tela.`,
  },

  // ===================================================== CSS
  {
    id: 'css-oque',
    track: 'CSS',
    level: 1,
    title: 'Seletores, propriedades e a cascata',
    summary: 'Como o CSS acha um elemento e decide qual regra vence.',
    body: `## Anatomia de uma regra
\`\`\`css
seletor {
  propriedade: valor;
}
h1 { color: #4b2fa0; font-size: 32px; }
\`\`\`

## Seletores que você usa todo dia
| Seletor | Pega |
| --- | --- |
| \`p\` | Toda tag \`<p>\` |
| \`.card\` | Todo elemento com \`class="card"\` |
| \`#topo\` | O elemento com \`id="topo"\` (único) |
| \`.card p\` | Todo \`<p>\` dentro de \`.card\` |
| \`a:hover\` | Link com o mouse em cima |
| \`li:first-child\` | O primeiro \`<li>\` |

## Cascata: quem vence?
1. \`!important\` (evite).
2. Especificidade: \`#id\` > \`.classe\` > \`tag\`.
3. Empate: a regra escrita por último vence.

## Onde colocar o CSS
Arquivo separado, sempre: \`<link rel="stylesheet" href="style.css">\` no \`<head>\`. Inline (\`style="..."\`) só em emergência.`,
  },

  {
    id: 'css-boxmodel',
    track: 'CSS',
    level: 1,
    title: 'Box Model: content, padding, border, margin',
    summary: 'Toda caixa tem 4 camadas. Entender isso resolve 90% dos "por que não alinha".',
    body: `## As 4 camadas
De dentro para fora: **content** → **padding** → **border** → **margin**.

\`\`\`css
.card {
  width: 200px;        /* content */
  padding: 16px;       /* espaço interno */
  border: 2px solid #333;
  margin: 24px;        /* espaço externo */
}
\`\`\`

## A pegadinha do width
Por padrão, \`width: 200px\` é só o conteúdo. A caixa de verdade mede 200 + 16·2 + 2·2 = 236px. Para \`width\` ser o tamanho final, use:

\`\`\`css
* { box-sizing: border-box; }
\`\`\`
Coloque isso no topo de todo projeto.

## Atalhos
\`margin: 10px 20px;\` = vertical 10, horizontal 20.
\`padding: 8px 16px 8px 16px;\` = topo, direita, baixo, esquerda (sentido horário).
\`margin: 0 auto;\` centraliza um bloco com largura definida.

## Inspecionar
No navegador, F12 → aba Elements → selecione um elemento → o diagrama colorido do Box Model aparece em "Computed". Use sempre.`,
  },

  {
    id: 'css-flexbox',
    track: 'CSS',
    level: 2,
    title: 'Flexbox completo',
    summary: 'display: flex, justify-content, align-items, gap, flex-wrap e flex: 1.',
    body: `## Pai e filhos
Flexbox é uma conversa entre um **container** (pai) e seus **itens** (filhos diretos). Tudo começa no pai:

\`\`\`css
.pai { display: flex; }
\`\`\`
Pronto: os filhos ficam em linha.

## Propriedades do PAI
| Propriedade | Faz |
| --- | --- |
| \`flex-direction\` | \`row\` (linha, padrão) ou \`column\` (coluna) |
| \`justify-content\` | Distribui no eixo principal: \`flex-start\`, \`center\`, \`space-between\`, \`space-around\`, \`space-evenly\` |
| \`align-items\` | Alinha no eixo cruzado: \`stretch\`, \`center\`, \`flex-start\`, \`flex-end\` |
| \`gap\` | Espaço entre itens: \`gap: 16px\` |
| \`flex-wrap\` | \`wrap\` quebra a linha quando não cabe |

## Propriedades dos FILHOS
- \`flex: 1\` → o item cresce e divide o espaço igualmente com outros \`flex: 1\`.
- \`flex: 0 0 200px\` → não cresce, não encolhe, tem 200px.
- \`align-self: center\` → alinha só este item.
- \`order: -1\` → muda a ordem visual sem mexer no HTML.

## Centralizar qualquer coisa
\`\`\`css
.centro { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
\`\`\`

## Layout clássico: menu
\`\`\`css
nav { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; }
nav ul { display: flex; gap: 20px; list-style: none; }
\`\`\``,
  },

  {
    id: 'css-grid-responsivo',
    track: 'CSS',
    level: 2,
    title: 'Grid e design responsivo',
    summary: 'grid-template-columns, media queries e unidades que se adaptam.',
    body: `## Grid: linhas E colunas
Flexbox é 1 dimensão. Grid é 2. Use Grid para a estrutura da página e Flex para alinhar coisas dentro dos blocos.

\`\`\`css
.galeria {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
\`\`\`
\`1fr\` = uma fração do espaço livre. \`repeat(3, 1fr)\` = 3 colunas iguais.

## Grid que se adapta sozinho
\`\`\`css
grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
\`\`\`
Cria quantas colunas de pelo menos 240px couberem. No celular vira 1 coluna sem media query.

## Media queries
\`\`\`css
.sidebar { width: 280px; }
@media (max-width: 768px) {
  .sidebar { width: 100%; }
}
\`\`\`
Comece pelo celular (mobile first) e use \`min-width\` para telas maiores.

## Unidades
- \`px\` fixo. \`%\` relativo ao pai. \`rem\` relativo à fonte raiz (16px) — use para texto e espaços.
- \`vw\`/\`vh\` = 1% da largura/altura da tela.
- \`clamp(1rem, 2.5vw, 2rem)\` = fonte fluida com mínimo e máximo.`,
  },

  // ===================================================== JavaScript
  {
    id: 'js-variaveis',
    track: 'JavaScript',
    level: 1,
    title: 'Variáveis e tipos: let, const, string, number, boolean',
    summary: 'Caixas com nome, os tipos básicos e typeof.',
    body: `## Declarando
\`\`\`js
const nome = "Breno";   // não muda
let pontos = 10;         // pode mudar
pontos = pontos + 5;     // 15
\`\`\`
Regra: use \`const\` por padrão. Troque para \`let\` só quando precisar reatribuir. Esqueça \`var\`.

## Tipos primitivos
| Tipo | Exemplo |
| --- | --- |
| string | \`"texto"\`, \`'texto'\`, \`\\\`template \${x}\\\`\` |
| number | \`42\`, \`3.14\`, \`-7\` |
| boolean | \`true\`, \`false\` |
| undefined | variável declarada sem valor |
| null | "vazio de propósito" |

\`typeof 42\` → \`"number"\`. \`typeof "a"\` → \`"string"\`.

## Template string
\`\`\`js
const msg = \`Olá, \${nome}! Você tem \${pontos} pontos.\`;
\`\`\`

## Conversões
\`Number("42")\` → 42. \`String(42)\` → "42". \`"5" + 1\` → "51" (cuidado!). \`"5" * 1\` → 5.`,
  },

  {
    id: 'js-condicionais',
    track: 'JavaScript',
    level: 1,
    title: 'Condicionais: if, else, operadores de comparação e lógicos',
    summary: '===, !==, &&, ||, ! e o operador ternário.',
    body: `## if / else if / else
\`\`\`js
if (nota >= 7) {
  console.log("Aprovado");
} else if (nota >= 5) {
  console.log("Recuperação");
} else {
  console.log("Reprovado");
}
\`\`\`

## Comparação
- \`===\` igual (valor E tipo). \`"5" === 5\` → false. **Use sempre este.**
- \`==\` igual "frouxo". \`"5" == 5\` → true. Evite.
- \`!==\` diferente. \`>\`, \`<\`, \`>=\`, \`<=\`.
- \`=\` NÃO compara: atribui. \`if (x = 5)\` é um bug clássico.

## Lógicos
- \`&&\` E: as duas condições. \`idade >= 18 && temCarteira\`
- \`||\` OU: pelo menos uma. \`isAdmin || isDono\`
- \`!\` NÃO: inverte. \`!logado\`

## Ternário (if de uma linha)
\`\`\`js
const status = nota >= 7 ? "aprovado" : "reprovado";
\`\`\`

## Valores "falsy"
Viram false num if: \`0\`, \`""\`, \`null\`, \`undefined\`, \`NaN\`, \`false\`. Todo o resto é truthy, inclusive \`"0"\` e \`[]\`.`,
  },

  {
    id: 'js-funcoes',
    track: 'JavaScript',
    level: 2,
    title: 'Funções: declaração, parâmetros, return e arrow functions',
    summary: 'Como empacotar lógica reutilizável e a sintaxe moderna.',
    body: `## Declarando
\`\`\`js
function somar(a, b) {
  return a + b;
}
const resultado = somar(2, 3); // 5
\`\`\`
\`return\` devolve o valor e **encerra** a função. Sem \`return\`, ela devolve \`undefined\`.

## Arrow function
\`\`\`js
const somar = (a, b) => a + b;          // return implícito
const dobrar = x => x * 2;              // um parâmetro: sem parênteses
const saudar = () => { console.log("oi"); }; // corpo com chaves: return explícito
\`\`\`

## Parâmetro padrão
\`\`\`js
function cumprimentar(nome = "visitante") { return \`Olá, \${nome}\`; }
\`\`\`

## Escopo
Variável criada dentro da função só existe lá dentro. Variáveis de fora são visíveis dentro (closure).

## Funções como valor
Funções podem ser passadas para outras funções:
\`\`\`js
botao.addEventListener("click", () => alert("clicou"));
[1, 2, 3].map(n => n * 10); // [10, 20, 30]
\`\`\``,
  },

  {
    id: 'js-arrays-loops',
    track: 'JavaScript',
    level: 2,
    title: 'Arrays, objetos e loops',
    summary: 'for, for...of, map, filter, find, reduce e como percorrer objetos.',
    body: `## Arrays
\`\`\`js
const frutas = ["maçã", "uva", "manga"];
frutas.length;        // 3
frutas[0];            // "maçã"
frutas.push("kiwi");  // adiciona no fim
\`\`\`

## Loops
\`\`\`js
for (let i = 0; i < frutas.length; i++) { console.log(frutas[i]); }
for (const fruta of frutas) { console.log(fruta); }   // mais limpo
\`\`\`

## Métodos que substituem loops
\`\`\`js
const precos = [10, 25, 40];
precos.map(p => p * 2);          // [20, 50, 80] — transforma
precos.filter(p => p > 20);      // [25, 40] — filtra
precos.find(p => p > 20);        // 25 — o primeiro
precos.reduce((soma, p) => soma + p, 0); // 75 — acumula
precos.forEach(p => console.log(p));
\`\`\`

## Objetos
\`\`\`js
const aluno = { nome: "Ana", nota: 8.5, aprovado: true };
aluno.nome;           // "Ana"
aluno["nota"];        // 8.5
aluno.turma = "DSM";  // adiciona
Object.keys(aluno);   // ["nome", "nota", "aprovado", "turma"]
\`\`\`

## Array de objetos (o caso mais comum)
\`\`\`js
const alunos = [{ nome: "Ana", nota: 8 }, { nome: "Bia", nota: 5 }];
const aprovados = alunos.filter(a => a.nota >= 7).map(a => a.nome); // ["Ana"]
\`\`\``,
  },

  {
    id: 'js-dom',
    track: 'JavaScript',
    level: 2,
    title: 'DOM: selecionar, alterar e reagir a eventos',
    summary: 'querySelector, textContent, classList, addEventListener.',
    body: `## O DOM é a página virando objetos
O navegador transforma seu HTML numa árvore de objetos. JavaScript mexe nessa árvore e a tela muda.

## Selecionar
\`\`\`js
const titulo = document.querySelector("h1");        // o primeiro h1
const cards = document.querySelectorAll(".card");   // todos
const btn = document.getElementById("enviar");
\`\`\`

## Alterar
\`\`\`js
titulo.textContent = "Novo título";       // texto (seguro)
titulo.innerHTML = "<em>Novo</em>";       // HTML (cuidado com dados do usuário)
titulo.classList.add("destaque");
titulo.classList.toggle("ativo");
titulo.style.color = "red";               // prefira classes
\`\`\`

## Criar
\`\`\`js
const li = document.createElement("li");
li.textContent = "Novo item";
document.querySelector("ul").appendChild(li);
\`\`\`

## Eventos
\`\`\`js
btn.addEventListener("click", () => { console.log("clicou"); });
input.addEventListener("input", e => { console.log(e.target.value); });
form.addEventListener("submit", e => { e.preventDefault(); /* não recarrega */ });
\`\`\`
Eventos comuns: \`click\`, \`input\`, \`change\`, \`submit\`, \`keydown\`, \`mouseenter\`.`,
  },

  {
    id: 'js-async',
    track: 'JavaScript',
    level: 3,
    title: 'Assíncrono: fetch, promises, async/await',
    summary: 'Como buscar dados de uma API sem travar a página.',
    body: `## O problema
Buscar dados na internet demora. JavaScript não espera parado: ele continua e avisa quando chegar. Isso é uma **Promise**.

## fetch + async/await (o jeito moderno)
\`\`\`js
async function carregarUsuarios() {
  try {
    const resposta = await fetch("https://api.exemplo.com/usuarios");
    if (!resposta.ok) throw new Error("HTTP " + resposta.status);
    const dados = await resposta.json();
    console.log(dados);
  } catch (erro) {
    console.error("Falhou:", erro.message);
  }
}
carregarUsuarios();
\`\`\`
- \`async\` marca a função. \`await\` pausa SÓ aquela função até a Promise resolver.
- \`try/catch\` pega erros de rede e os que você lançou.

## Enviando dados
\`\`\`js
await fetch("/api/alunos", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ nome: "Ana", nota: 8 })
});
\`\`\`

## Várias ao mesmo tempo
\`\`\`js
const [a, b] = await Promise.all([fetch(urlA), fetch(urlB)]);
\`\`\`

## setTimeout
\`\`\`js
setTimeout(() => console.log("1s depois"), 1000);
\`\`\``,
  },

  // ===================================================== Docker
  {
    id: 'docker-oque',
    track: 'Docker',
    level: 1,
    title: 'Imagem, container e por que isolar',
    summary: 'O problema que o Docker resolve e o vocabulário básico.',
    body: `## O problema
"Na minha máquina funciona." Versões diferentes de Node, Java, Python, bancos, variáveis de ambiente. Cada máquina é diferente e o deploy quebra.

## A solução
Empacotar a aplicação **com tudo que ela precisa** numa caixa padronizada que roda igual em qualquer lugar.

## Vocabulário
| Termo | É | Analogia |
| --- | --- | --- |
| **Imagem** | Receita imutável: SO base + dependências + seu código | Molde |
| **Container** | Uma instância rodando da imagem, isolada | Peça fundida no molde |
| **Dockerfile** | Arquivo de texto que descreve como construir a imagem | Receita escrita |
| **Registry** | Repositório de imagens (Docker Hub) | Loja de moldes |
| **Volume** | Pasta persistente fora do container | HD externo |

Uma imagem gera N containers. Apagar um container não afeta a imagem.

## O que o container compartilha
O **kernel** do host. Por isso é leve (MBs, segundos) comparado a uma VM (GBs, minutos). Mas é isolado em processos, rede e sistema de arquivos.`,
  },

  {
    id: 'docker-comandos',
    track: 'Docker',
    level: 1,
    title: 'Comandos essenciais: run, ps, stop, rm, images, logs, exec',
    summary: 'O ciclo de vida de um container na linha de comando.',
    body: `## Rodar
\`\`\`bash
docker run -d --name meu-nginx -p 8080:80 nginx
\`\`\`
- \`-d\` detached: roda em segundo plano e devolve o terminal.
- \`--name\` nome amigável (senão vem um aleatório tipo \`brave_tesla\`).
- \`-p 8080:80\` porta do HOST : porta do CONTAINER. Acesse em localhost:8080.
- \`nginx\` imagem. Se não existir localmente, baixa do Docker Hub.

## Ver
\`\`\`bash
docker ps          # rodando
docker ps -a       # todos, inclusive parados
docker images      # imagens locais
docker logs -f meu-nginx   # saída do container (-f acompanha)
\`\`\`

## Entrar
\`\`\`bash
docker exec -it meu-nginx sh     # abre um shell dentro do container
\`\`\`

## Parar e limpar
\`\`\`bash
docker stop meu-nginx
docker rm meu-nginx              # só depois de parar (ou -f)
docker rmi nginx                 # apaga a imagem
docker system prune              # limpa tudo que não está em uso
\`\`\`

## Variáveis de ambiente
\`\`\`bash
docker run -d -e POSTGRES_PASSWORD=senha123 -p 5432:5432 postgres:16
\`\`\``,
  },

  {
    id: 'docker-dockerfile',
    track: 'Docker',
    level: 2,
    title: 'Dockerfile: criando sua própria imagem',
    summary: 'FROM, WORKDIR, COPY, RUN, EXPOSE, CMD e as boas práticas de camadas.',
    body: `## Exemplo: app Node
\`\`\`dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
\`\`\`

## Linha por linha
- \`FROM\` imagem base. \`alpine\` é mínima (5 MB).
- \`WORKDIR\` pasta de trabalho dentro da imagem.
- \`COPY package*.json ./\` **antes** do código: se o código mudar mas as dependências não, o Docker reaproveita a camada do \`npm ci\` (cache). Build vai de minutos para segundos.
- \`RUN\` executa na hora do build.
- \`EXPOSE\` documenta a porta (não publica; \`-p\` publica).
- \`CMD\` comando ao iniciar o container. Formato JSON é o correto.

## Build e run
\`\`\`bash
docker build -t minha-api:1.0 .
docker run -d --name api -p 3000:3000 minha-api:1.0
\`\`\`

## .dockerignore
\`\`\`
node_modules
.git
.env
\`\`\`
Sem isso você copia o node_modules local para dentro da imagem (lento e errado).

## Exemplo: Spring Boot
\`\`\`dockerfile
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
\`\`\``,
  },

  {
    id: 'docker-compose',
    track: 'Docker',
    level: 3,
    title: 'Docker Compose: app + banco com um comando',
    summary: 'docker-compose.yml, services, volumes, redes e depends_on.',
    body: `## O problema
Sua API precisa de um Postgres. Subir os dois na mão, com rede e volume, é chato. Compose descreve tudo num arquivo.

## docker-compose.yml
\`\`\`yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://app:senha@db:5432/app
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: senha
      POSTGRES_DB: app
    volumes:
      - dados:/var/lib/postgresql/data

volumes:
  dados:
\`\`\`

## Pontos-chave
- Os serviços se enxergam pelo **nome**: a API acessa o banco em \`db:5432\`, não em localhost.
- \`volumes\` guarda os dados do banco fora do container. Sem isso, \`docker compose down\` apaga tudo.
- \`depends_on\` só controla a ordem de start, não espera o banco ficar pronto. Use healthcheck ou retry na API.

## Comandos
\`\`\`bash
docker compose up -d        # sobe tudo
docker compose logs -f api  # logs de um serviço
docker compose down         # derruba (mantém volumes)
docker compose down -v      # derruba e apaga volumes
\`\`\``,
  },

  {
    id: 'docker-portas-env',
    track: 'Docker',
    level: 2,
    title: 'Portas e variáveis de ambiente: -p e -e',
    summary: 'Como o mundo de fora fala com o container e como configurá-lo sem mudar a imagem.',
    body: `## O container tem a própria rede
Um nginx dentro do container ouve na porta 80 **do container**. Sua máquina não enxerga essa porta até você publicar.

## Publicando portas
\`\`\`bash
docker run -d --name site -p 8080:80 nginx
\`\`\`
A regra é sempre **HOST:CONTAINER**. Aqui, localhost:8080 na sua máquina cai na porta 80 do container.

| Comando | Significa |
| --- | --- |
| \`-p 8080:80\` | porta 8080 do host → 80 do container |
| \`-p 3000:3000\` | mesma porta dos dois lados |
| \`-p 127.0.0.1:5432:5432\` | publica só para a própria máquina (bom para bancos) |

## Erros comuns
- **port is already allocated**: outra coisa já usa a porta do host. Troque o lado esquerdo: \`-p 8081:80\`.
- Inverter os lados: \`-p 80:8080\` aponta para uma porta que o container não ouve. O site não abre e não dá erro.
- \`EXPOSE\` no Dockerfile **não publica**. Só documenta.

## Variáveis de ambiente
\`\`\`bash
docker run -d -e NODE_ENV=production -e PORT=3000 minha-api
docker run -d --env-file .env minha-api
\`\`\`
A imagem fica igual em dev, teste e produção; o que muda é a configuração passada por \`-e\`. Senhas e URLs de banco **nunca** vão dentro da imagem.

## Conferindo
\`\`\`bash
docker ps                 # coluna PORTS mostra 0.0.0.0:8080->80/tcp
docker logs site          # o que o processo escreveu
docker exec site env      # variáveis dentro do container
\`\`\``,
  },

  {
    id: 'docker-volumes',
    track: 'Docker',
    level: 2,
    title: 'Volumes: dados que sobrevivem ao container',
    summary: 'Volume nomeado, bind mount e onde cada banco guarda os dados.',
    body: `## O container é descartável
Tudo que o container escreve no próprio disco some quando ele é removido. Isso é ótimo para a aplicação e péssimo para o banco de dados.

## Volume nomeado
\`\`\`bash
docker volume create dados
docker run -d --name banco -e POSTGRES_PASSWORD=segredo -v dados:/var/lib/postgresql/data postgres:16
\`\`\`
A regra é **VOLUME:/caminho/dentro/do/container**. O Docker guarda a pasta fora do container; você pode dar stop, rm e run de novo com o mesmo \`-v\` e os dados continuam lá.

## Onde cada banco guarda os dados
| Imagem | Caminho |
| --- | --- |
| postgres | \`/var/lib/postgresql/data\` |
| mysql / mariadb | \`/var/lib/mysql\` |
| mongo | \`/data/db\` |
| redis | \`/data\` |

## Bind mount (pasta da sua máquina)
\`\`\`bash
docker run -d -p 8080:80 -v ./site:/usr/share/nginx/html nginx
\`\`\`
Liga uma pasta **sua** a uma pasta do container. Você edita o arquivo no editor e o container enxerga na hora. Ideal para desenvolvimento.

## Comandos
\`\`\`bash
docker volume ls
docker volume inspect dados
docker volume rm dados        # apaga os dados de verdade
\`\`\`

## Regra prática
- Banco de dados e uploads → volume nomeado.
- Código em desenvolvimento → bind mount.
- Nada importante dentro do container sem volume.`,
  },

  {
    id: 'git-basico',
    track: 'Ferramentas',
    level: 1,
    title: 'Git no dia a dia',
    summary: 'init, add, commit, branch, push e pull — o mínimo para trabalhar em equipe.',
    body: `## Por que Git
Git guarda o histórico do projeto. Você volta no tempo, trabalha em paralelo com colegas e não perde código.

## O ciclo básico
\`\`\`bash
git init                      # começa um repositório na pasta
git status                    # o que mudou?
git add .                     # prepara tudo para o commit
git commit -m "Adiciona tela de login"
\`\`\`
Um commit é uma foto do projeto com uma mensagem. Mensagem boa diz **o que** mudou, no presente.

## Branches
\`\`\`bash
git switch -c feature/cadastro   # cria e entra numa branch
git switch main                  # volta
git merge feature/cadastro       # traz as mudanças para a main
\`\`\`
Cada tarefa em uma branch. A main fica sempre funcionando.

## Remoto (GitHub)
\`\`\`bash
git remote add origin https://github.com/usuario/projeto.git
git push -u origin main       # envia
git pull                      # traz o que os colegas enviaram
\`\`\`

## .gitignore
\`\`\`
node_modules
.env
dist
\`\`\`
Nunca suba dependências, senhas ou arquivos gerados.

## Desfazendo
- \`git restore arquivo\` descarta mudanças não commitadas.
- \`git commit --amend\` corrige o último commit (antes do push).
- \`git revert HASH\` cria um commit que desfaz outro (seguro depois do push).`,
  },
];

const TRACKS = ['HTML', 'CSS', 'JavaScript', 'Docker', 'Ferramentas'];
