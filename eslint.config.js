/* ESLint (flat config).
   O jogo usa scripts clássicos que compartilham o escopo global (sem bundler, para abrir com duplo clique).
   Por isso, para cada arquivo de src/, os nomes declarados no topo dos OUTROS arquivos entram como globais
   permitidos. A lista é descoberta automaticamente lendo o código com o parser do próprio ESLint. */
const fs = require('fs');
const path = require('path');
const js = require('@eslint/js');
const globals = require('globals');
const espree = require('espree');

const SRC = ['src/core', 'src/content', 'src/systems', 'src/ui', 'src/engine'].flatMap(dir =>
  fs
    .readdirSync(path.join(__dirname, dir))
    .filter(f => f.endsWith('.js'))
    .map(f => `${dir}/${f}`),
);

// Nomes declarados no nível mais alto de cada arquivo (const/let/var/function)
function topLevelNames(file) {
  const ast = espree.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'), { ecmaVersion: 'latest', sourceType: 'script' });
  const names = [];
  for (const node of ast.body) {
    if (node.type === 'FunctionDeclaration') names.push(node.id.name);
    if (node.type === 'VariableDeclaration') for (const d of node.declarations) if (d.id.type === 'Identifier') names.push(d.id.name);
  }
  return names;
}
const declared = Object.fromEntries(SRC.map(f => [f, topLevelNames(f)]));
const sharedFor = file =>
  Object.fromEntries(
    Object.entries(declared)
      .filter(([f]) => f !== file)
      .flatMap(([, names]) => names.map(n => [n, 'writable'])),
  );

const baseRules = {
  'no-unused-vars': ['warn', { vars: 'local', args: 'none', caughtErrors: 'none' }],
  'no-empty': ['error', { allowEmptyCatch: true }],
  eqeqeq: ['error', 'always'],
  'no-var': 'error',
  'prefer-const': ['warn', { destructuring: 'all' }],
};

module.exports = [
  { ignores: ['vendor/**', 'node_modules/**', 'coverage/**', 'test-results/**'] },
  js.configs.recommended,
  // Código do jogo (navegador, scripts clássicos)
  ...SRC.map(file => ({
    files: [file],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: { ...globals.browser, THREE: 'readonly', ...sharedFor(file) },
    },
    // prefer-const desligado: um global declarado aqui pode ser reatribuído em outro arquivo (ex.: t, camZoom)
    rules: { ...baseRules, 'prefer-const': 'off', 'no-redeclare': ['error', { builtinGlobals: false }] },
  })),
  // Service worker
  { files: ['sw.js'], languageOptions: { sourceType: 'script', globals: globals.serviceworker }, rules: baseRules },
  // Node: testes, scripts e esta config
  {
    files: ['tests/**/*.js', 'scripts/**/*.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'commonjs', globals: globals.node },
    rules: baseRules,
  },
  // Testes e2e rodam trechos dentro da página (page.evaluate): os globais do jogo existem lá
  { files: ['tests/e2e/**/*.js', 'scripts/screenshots.js'], languageOptions: { globals: { ...globals.browser, ...sharedFor(null) } } },
];
