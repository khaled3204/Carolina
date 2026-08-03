'use strict';

function sendJson(res, status, data, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    ...extraHeaders
  };

  const existing = res.getHeader?.('Set-Cookie');
  if (existing) {
    headers['Set-Cookie'] = existing;
  }

  res.writeHead(status, headers);
  res.end(JSON.stringify(data));
}

function setCookie(res, cookie) {
  const prev = res.getHeader?.('Set-Cookie');
  if (!prev) {
    res.setHeader('Set-Cookie', cookie);
  } else if (Array.isArray(prev)) {
    res.setHeader('Set-Cookie', [...prev, cookie]);
  } else {
    res.setHeader('Set-Cookie', [prev, cookie]);
  }
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch {
      return {};
    }
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function methodNotAllowed(res, allow = ['GET', 'POST']) {
  sendJson(res, 405, { error: 'Method not allowed' }, { Allow: allow.join(', ') });
}

/** Resolve /api/<resource>/:id from Vercel req.query or the request path. */
function getResourceId(req, resource) {
  const q = req.query?.id;
  if (q != null && q !== '') {
    const raw = Array.isArray(q) ? q[0] : String(q);
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const parts = url.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf(resource);
  const rest = idx !== -1 ? parts.slice(idx + 1) : [];
  if (!rest.length) return null;
  try {
    return decodeURIComponent(rest[rest.length - 1]);
  } catch {
    return rest[rest.length - 1];
  }
}

module.exports = { sendJson, setCookie, readBody, methodNotAllowed, getResourceId };
