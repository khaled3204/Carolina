'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = process.cwd();
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function loadHandler(relPath) {
  const full = path.join(ROOT, 'api', relPath);
  delete require.cache[require.resolve(full)];
  return require(full);
}

async function routeApi(req, res, pathname) {
  const map = [
    [/^\/api\/auth\/login\/?$/, 'auth/login.js'],
    [/^\/api\/auth\/logout\/?$/, 'auth/logout.js'],
    [/^\/api\/auth\/me\/?$/, 'auth/me.js'],
    [/^\/api\/auth\/credentials\/?$/, 'auth/credentials.js'],
    [/^\/api\/auth\/forgot-password\/?$/, 'auth/forgot-password.js'],
    [/^\/api\/auth\/reset-password\/?$/, 'auth/reset-password.js'],
    [/^\/api\/products\/?$/, 'products/index.js'],
    [/^\/api\/products\/[^/]+\/?$/, 'products/[id].js'],
    [/^\/api\/sales\/?$/, 'sales/index.js'],
    [/^\/api\/sales\/[^/]+\/?$/, 'sales/[id].js'],
    [/^\/api\/orders\/?$/, 'orders/index.js'],
    [/^\/api\/orders\/[^/]+\/?$/, 'orders/[id].js'],
    [/^\/api\/upload\/?$/, 'upload.js']
  ];

  for (const [re, file] of map) {
    if (re.test(pathname)) {
      const handler = loadHandler(file);
      return handler(req, res);
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const stream = fs.createReadStream(filePath);
  res.writeHead(200, { 'Content-Type': type });
  stream.pipe(res);
  stream.on('error', () => {
    res.writeHead(404);
    res.end('Not found');
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(url.pathname);

    if (pathname === '/admin' || pathname === '/admin/') {
      pathname = '/admin/index.html';
    }

    if (pathname.startsWith('/api/')) {
      return routeApi(req, res, pathname);
    }

    let filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }

    return sendFile(res, filePath);
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Server error' }));
  }
});

server.listen(PORT, () => {
  console.log(`Carolina running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
