#!/usr/bin/env node
/* Servidor estático mínimo, sem dependências: `npm start` (ou `node scripts/serve.js 8080`).
   Necessário para testar o service worker (PWA), que não funciona abrindo o index.html com duplo clique. */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function createServer() {
  return http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(ROOT, url);
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end('Proibido');
      return;
    } // impede ../ para fora do projeto
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Não encontrado');
        return;
      }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(data);
    });
  });
}

if (require.main === module) {
  const port = Number(process.argv[2] || process.env.PORT || 8080);
  createServer().listen(port, () => console.log(`CodeRealm rodando em http://localhost:${port}  (Ctrl+C para parar)`));
}

module.exports = { createServer };
