# Segurança

## Versões com suporte

Só a versão mais recente (branch `main`, publicada no GitHub Pages) recebe correções.

## Como reportar uma vulnerabilidade

**Não abra uma issue pública.** Use o recurso [Report a vulnerability](https://github.com/breesiqueiramkt/coderealm/security/advisories/new) (aba _Security_ do repositório), descrevendo o problema e como reproduzir. A resposta inicial deve vir em até 7 dias.

## Escopo e modelo de ameaça

O CodeRealm roda 100% no navegador, sem servidor nem contas. Pontos relevantes:

- **Código do jogador**: o JavaScript dos desafios roda num Web Worker com limite de tempo; o HTML/CSS/JS do playground e dos projetos roda num `iframe` isolado. Ele executa apenas no próprio navegador de quem escreveu.
- **Docker**: nada é executado de verdade; os comandos são interpretados por um simulador (`src/systems/docker-sim.js`).
- **Dados**: o progresso fica no `localStorage` do navegador. Arquivos de save importados são validados antes de serem aplicados.
