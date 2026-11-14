# Changelog

Todas as mudanças relevantes do projeto. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [6.0.0] — 2026-11-13

Versão "projeto profissional": mundo central, fim de jornada com certificado, celular, PWA, testes automatizados e publicação.

### Adicionado

- **Academia do Código**: mapa central com 8 portais (trancados até concluir a fase anterior), quiosques interativos (Exame Final, Missões, Alfaiate, Biblioteca, Arena), fonte e a guia **Reitora Byte**. Jogos novos começam aqui.
- **Portal de volta à Academia** em todas as áreas.
- **Exame Final** (10 questões, aprovação com 7) e **certificado de conclusão** em PNG, também disponível no Perfil.
- **Controles de toque** (direcional + botão de ação) e câmera ajustada para tela em pé.
- **Configurações**: volume de música e efeitos separados, qualidade gráfica (auto/alta/média/baixa), movimento reduzido, velocidade do diálogo, controles de toque, rever tutorial.
- **Tutorial** na primeira vez que entra no mundo; botão **▶ Jogar** fixo no menu; **Esc** alterna entre menu e jogo.
- **PWA**: instalável e jogável offline (service worker, manifest, ícones).
- **Robustez**: barra de erro amigável, backup automático do save com recuperação, aviso e modo sem 3D quando o navegador não tem WebGL.
- **Acessibilidade**: link "pular para o conteúdo", foco visível, rótulos ARIA, `aria-live` em diálogos e avisos, respeito a `prefers-reduced-motion`.
- Conquistas **Diplomado** e **Turista** (19 no total).
- **Testes**: 147 unitários (`node:test`) e 11 de ponta a ponta (Playwright), incluindo as 8 fases jogadas pela interface e o modo offline.
- **Ferramentas**: ESLint (com descoberta automática dos globais compartilhados), Prettier, EditorConfig, servidor local sem dependências, geradores de ícones e screenshots.
- **GitHub**: CI (lint, formatação, unitários, e2e), deploy automático no GitHub Pages, Dependabot, templates de issue e PR.
- **Documentação**: README, arquitetura, guia de conteúdo, design, roadmap, contribuição, código de conduta, segurança.

### Alterado

- Código reorganizado em `src/core`, `src/content`, `src/systems`, `src/ui` e `src/engine`; dados dos mapas separados da renderização.
- Simulador de Docker extraído para `src/systems/docker-sim.js`, sem dependência de tela (testável).
- Banco de minidesafios, itens e conquistas movidos para `src/content/`.
- Código formatado com Prettier (fica mais fácil de ler e estudar).
- Rótulos de portal com contraste automático (texto escuro em fundo claro).

### Corrigido

- Fase 4: quem rodava o goblin sem `--name` antes do comando certo ficava preso na mensagem de nome errado.
- A dica da tela não atualizava depois de uma conversa.
- Abrir um quiosque (ex.: Alfaiate) levava ao menu sem um jeito claro de voltar ao jogo.
- Avisos longos saíam da tela no celular.
- O aviso de conquista quebrava se o elemento da tela não existisse.

## [5.0.0] — 2026-11-12

### Adicionado

- Herói novo (braços, pernas, animação), personagem customizável, loja e 3 mascotes.
- Moedas e baús nos mapas, estrelas por fase, 17 conquistas, desafio do dia e sequência diária.
- 35 minidesafios em 4 formatos e 6 projetos reais na Arena, verificados no DOM renderizado.

### Alterado

- Chão, árvores e decoração em `InstancedMesh` (de ~500 para ~80 draw calls); mundo pausado com o menu aberto.

## [4.0.0] — 2026-11-11

### Adicionado

- Fases 5 a 8 de Docker (Dockerfile, portas, volumes, Compose) e desafios em duas partes.
- Som e música gerados por Web Audio, Perfil com exportar/importar save, modo desempenho automático.

## [3.0.0] — 2026-11-10

### Adicionado

- Mundo em 3D com Three.js, menu com mapa de fases e repetição, Biblioteca e Arena de treino.

## [2.0.0] — 2026-11-10

### Adicionado

- As 4 primeiras fases jogáveis com NPCs e os desafios de drag-and-drop, CSS, JavaScript e terminal.

## [1.0.0] — 2026-11-10

### Adicionado

- Protótipo em Canvas 2D: movimento em grid, portão e quiz de HTML.

[6.0.0]: https://github.com/breesiqueiramkt/coderealm/releases/tag/v6.0.0
