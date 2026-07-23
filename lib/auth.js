'use strict';

const crypto = require('crypto');
const { loadDb, saveDb, verifyPassword, scryptHash } = require('./store');

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const RESET_TTL_MS = 1000 * 60 * 30; // 30 minutes

function secret() {
  return process.env.SESSION_SECRET || 'carolina-dev-secret-change-me';
}

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromB64url(input) {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const str = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(str, 'base64').toString('utf8');
}

function signToken(payload) {
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(fromB64url(body));
    if (!payload?.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const i = part.indexOf('=');
        if (i === -1) return [part, ''];
        return [part.slice(0, i), decodeURIComponent(part.slice(i + 1))];
      })
  );
}

function getBearer(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return null;
}

function getSession(req) {
  const cookies = parseCookies(req);
  return verifyToken(getBearer(req) || cookies.carolina_admin);
}

function sessionCookie(token, maxAgeSec = TOKEN_TTL_MS / 1000) {
  const secure = process.env.VERCEL || process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `carolina_admin=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(maxAgeSec)}${secure}`;
}

function clearSessionCookie() {
  const secure = process.env.VERCEL || process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `carolina_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

async function login(username, password) {
  const db = await loadDb();
  const creds = db.credentials;
  if (
    String(username).trim().toLowerCase() !== String(creds.username).trim().toLowerCase() ||
    !verifyPassword(password, creds.passwordSalt, creds.passwordHash)
  ) {
    return { ok: false, error: 'Invalid username or password' };
  }
  const token = signToken({
    sub: creds.username,
    role: 'admin',
    exp: Date.now() + TOKEN_TTL_MS
  });
  return { ok: true, token, username: creds.username, email: creds.email };
}

async function requireAdmin(req) {
  const session = getSession(req);
  if (!session || session.role !== 'admin') {
    return { ok: false, error: 'Unauthorized', status: 401 };
  }
  return { ok: true, session };
}

async function changeCredentials({ username, password, email, currentPassword }) {
  const db = await loadDb();
  if (!verifyPassword(currentPassword, db.credentials.passwordSalt, db.credentials.passwordHash)) {
    return { ok: false, error: 'Current password is incorrect', status: 400 };
  }

  if (username && String(username).trim()) {
    db.credentials.username = String(username).trim();
  }
  if (email && String(email).trim()) {
    db.credentials.email = String(email).trim().toLowerCase();
  }
  if (password && String(password).length >= 8) {
    const { salt, hash } = scryptHash(password);
    db.credentials.passwordSalt = salt;
    db.credentials.passwordHash = hash;
  } else if (password) {
    return { ok: false, error: 'New password must be at least 8 characters', status: 400 };
  }

  await saveDb(db);
  const token = signToken({
    sub: db.credentials.username,
    role: 'admin',
    exp: Date.now() + TOKEN_TTL_MS
  });
  return {
    ok: true,
    token,
    username: db.credentials.username,
    email: db.credentials.email
  };
}

async function createResetToken(email) {
  const db = await loadDb();
  const registered = String(db.credentials.email || '').toLowerCase();
  if (String(email || '').trim().toLowerCase() !== registered) {
    // Same response either way to avoid email enumeration
    return { ok: true, sent: false };
  }

  const token = crypto.randomBytes(24).toString('hex');
  db.resetTokens[token] = Date.now() + RESET_TTL_MS;
  // prune expired
  for (const [key, exp] of Object.entries(db.resetTokens)) {
    if (Date.now() > exp) delete db.resetTokens[key];
  }
  await saveDb(db);
  return { ok: true, sent: true, token, email: registered };
}

async function resetPasswordWithToken(token, newPassword, newUsername) {
  const db = await loadDb();
  const exp = db.resetTokens?.[token];
  if (!exp || Date.now() > exp) {
    return { ok: false, error: 'Reset link is invalid or expired', status: 400 };
  }
  if (!newPassword || String(newPassword).length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters', status: 400 };
  }

  const { salt, hash } = scryptHash(newPassword);
  db.credentials.passwordSalt = salt;
  db.credentials.passwordHash = hash;
  if (newUsername && String(newUsername).trim()) {
    db.credentials.username = String(newUsername).trim();
  }
  delete db.resetTokens[token];
  await saveDb(db);
  return { ok: true, username: db.credentials.username };
}

module.exports = {
  login,
  requireAdmin,
  changeCredentials,
  createResetToken,
  resetPasswordWithToken,
  sessionCookie,
  clearSessionCookie,
  getSession,
  signToken
};
