# Como contribuir

Obrigado pelo interesse! O CodeRealm é um projeto de aprendizado: contribuições de quem está começando são muito bem-vindas, de correção de texto a fase nova.

## Formas de ajudar

- **Reportar bug** ou **sugerir ideia**: abra uma [issue](https://github.com/breesiqueiramkt/coderealm/issues/new/choose) usando o modelo.
- **Conteúdo**: minidesafios, artigos, projetos e fases. Comece pelo [guia de conteúdo](docs/CONTEUDO.md).
- **Código**: veja as issues marcadas com `boa primeira issue` ou o [roadmap](docs/ROADMAP.md).

## Ambiente

Requisitos: Git e Node.js 20+ (recomendado 22).

```bash
git clone https://github.com/<seu-usuario>/coderealm.git
cd coderealm
npm install
npx playwright install chromium   # só para os testes no navegador
npm start                         # http://localhost:8080
```

## Antes de abrir o pull request

```bash
npm run check      # ESLint + Prettier + 147 testes unitários
npm run test:e2e   # testes no navegador (~1 min)
npm run format     # se o check reclamar de formatação
```

Jogue a parte que você mudou. Se mudou algo visual, coloque um print no PR.

## Fluxo

1. Faça um fork e crie uma branch a partir da `main`: `git switch -c feat/fase-gitignore`.
2. Commits pequenos, com mensagens no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/):
   - `feat: adiciona fase 9 (gitignore)`
   - `fix: corrige dica da fase 3 com senha vazia`
   - `docs: explica volumes no guia de conteúdo`
   - `test: cobre o comando docker logs`
   - `chore`, `refactor`, `style` para o resto
3. Abra o PR para a `main` preenchendo o modelo. O CI roda tudo automaticamente.

## Padrões de código

- **Sem bundler**: cada arquivo de `src/` é um script clássico carregado pelo `index.html`. Se criar um arquivo novo, adicione o `<script>` na ordem certa e a entrada em `SHELL` no `sw.js` (para funcionar offline). Veja [docs/ARQUITETURA.md](docs/ARQUITETURA.md).
- **Dados em `src/content/`**, regras em `src/core/` e `src/systems/`, tela em `src/ui/` e `src/engine/`.
- Lógica nova que não depende de tela deve ganhar teste em `tests/unit/`.
- Textos para o jogador em português do Brasil, frases curtas, sem jargão sem explicação.
- Comentários explicam o **porquê**, não o óbvio.

## Licença

Ao contribuir, você concorda que sua contribuição seja licenciada sob a [licença MIT](LICENSE) do projeto.
