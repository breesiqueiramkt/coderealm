# Roadmap

Ideias organizadas por horizonte. Nada aqui é promessa de data: é a direção. Sugestões são bem-vindas via issue ("💡 Ideia ou melhoria").

## Próximo (v6.x)

- [ ] Fase 9: `.gitignore` e `.dockerignore` (tipo `file`, reaproveitando o portão)
- [ ] Mais minidesafios: meta de 15 por trilha
- [ ] Projeto real "Galeria em Grid" (CSS Grid + media queries)
- [ ] Tradução da interface para inglês (os textos já estão concentrados em `content/` e `ui/`)
- [ ] Atalho de teclado para dica e para rodar testes dentro dos editores

## Médio prazo (v7)

- [ ] **Mundo aberto**: áreas vizinhas conectadas por trilhas, sem tela de transição. A base existe (portais e `next`); falta carregar o mapa vizinho em segundo plano.
- [ ] **Modelos glTF** com animação (packs CC0 como Quaternius/Kenney) no lugar das formas geométricas, mantendo as formas como fallback leve.
- [ ] **Trilha de Git** com um simulador no mesmo estilo do `docker-sim.js` (`git add`, `commit`, `branch`, `merge`).
- [ ] **Editor com destaque de sintaxe** (CodeMirror 6, embutido em `vendor/` para manter o modo offline).

## Longo prazo (v8+)

- [ ] **Contas e ranking da turma**: backend opcional (Node + SQLite ou Supabase) recebendo o mesmo JSON do save.
- [ ] **Modo professor**: criar uma turma, ver o progresso e os erros mais comuns por fase.
- [ ] **Trilhas novas**: APIs REST com Node/Express, SQL, Java + Spring Boot.
- [ ] **Editor de fases** dentro do jogo para professores criarem desafios sem programar.

## Concluído

Veja o [CHANGELOG](../CHANGELOG.md).
