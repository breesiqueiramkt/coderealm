/* Carrega scripts do jogo (feitos para o navegador) dentro do Node, num contexto isolado (vm).
   Como os scripts clássicos compartilham o escopo global, todos rodam juntos num único "script"
   e devolvemos os nomes pedidos. DOM, áudio e UI são substituídos por dublês simples. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');

function memoryStorage() {
  const data = new Map();
  return {
    getItem: k => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: k => data.delete(k),
    clear: () => data.clear(),
    _data: data,
  };
}

/**
 * @param {string[]} files caminhos relativos à raiz (ex.: 'src/core/state.js')
 * @param {string[]} names nomes globais para devolver
 * @param {object} extra dublês adicionais no contexto
 */
function loadScripts(files, names, extra = {}) {
  const toasts = [];
  const sandbox = {
    console,
    Math,
    Date,
    JSON,
    document: { getElementById: () => null, querySelectorAll: () => [], createElement: () => ({ style: {} }) },
    localStorage: memoryStorage(),
    matchMedia: () => ({ matches: false }),
    navigator: {},
    location: { protocol: 'file:', search: '' },
    addEventListener() {},
    setTimeout: fn => fn(),
    UI: { toast: m => toasts.push(m) },
    Sfx: new Proxy({}, { get: () => () => {} }), // qualquer som vira função vazia
    renderHud() {},
    ...extra,
  };
  const code = files.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n;\n');
  const ctx = vm.createContext(sandbox);
  vm.runInContext(`${code}\n;this.__out = { ${names.join(', ')} };`, ctx, { filename: 'coderealm-bundle.js' });
  return Object.assign(ctx.__out, { sandbox, toasts });
}

// Arquivos de conteúdo + lógica pura, na mesma ordem do index.html
const CONTENT = [
  'src/content/phases.js',
  'src/content/maps.js',
  'src/content/library.js',
  'src/content/minis.js',
  'src/content/projects.js',
  'src/content/cosmetics.js',
  'src/content/achievements.js',
];
const CORE = ['src/core/settings.js', ...CONTENT, 'src/core/state.js'];

module.exports = { loadScripts, CONTENT, CORE, ROOT };
