'use strict';

const crypto = require('crypto');
const { loadDb, mutateDb, verifyPassword, scryptHash } = require('./store');

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
  try {
    return await mutateDb((db) => {
      if (!db.credentials) {
        const err = new Error('Admin credentials are missing — check BLOB_READ_WRITE_TOKEN');
        err.status = 500;
        throw err;
      }
      if (!verifyPassword(currentPassword, db.credentials.passwordSalt, db.credentials.passwordHash)) {
        const err = new Error('Current password is incorrect');
        err.status = 400;
        throw err;
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
        const err = new Error('New password must be at least 8 characters');
        err.status = 400;
        throw err;
      }

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
    });
  } catch (err) {
    return { ok: false, error: err.message || 'Could not save credentials', status: err.status || 500 };
  }
}

async function createResetToken(email) {
  const probe = await loadDb({ fresh: true });
  const registered = String(probe.credentials?.email || '').toLowerCase();
  if (String(email || '').trim().toLowerCase() !== registered) {
    return { ok: true, sent: false };
  }

  try {
    return await mutateDb((db) => {
      if (!db.resetTokens || typeof db.resetTokens !== 'object') db.resetTokens = {};
      const token = crypto.randomBytes(24).toString('hex');
      db.resetTokens[token] = Date.now() + RESET_TTL_MS;
      for (const [key, exp] of Object.entries(db.resetTokens)) {
        if (Date.now() > exp) delete db.resetTokens[key];
      }
      return { ok: true, sent: true, token, email: registered };
    });
  } catch (err) {
    return { ok: false, error: err.message || 'Could not create reset token', status: err.status || 500 };
  }
}

async function resetPasswordWithToken(token, newPassword, newUsername) {
  try {
    return await mutateDb((db) => {
      if (!db.resetTokens || typeof db.resetTokens !== 'object') db.resetTokens = {};
      const exp = db.resetTokens[token];
      if (!exp || Date.now() > exp) {
        const err = new Error('Reset link is invalid or expired');
        err.status = 400;
        throw err;
      }
      if (!newPassword || String(newPassword).length < 8) {
        const err = new Error('Password must be at least 8 characters');
        err.status = 400;
        throw err;
      }

      const { salt, hash } = scryptHash(newPassword);
      db.credentials.passwordSalt = salt;
      db.credentials.passwordHash = hash;
      if (newUsername && String(newUsername).trim()) {
        db.credentials.username = String(newUsername).trim();
      }
      delete db.resetTokens[token];
      return { ok: true, username: db.credentials.username };
    });
  } catch (err) {
    return { ok: false, error: err.message || 'Could not reset password', status: err.status || 500 };
  }
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
  signToken,
  verifyToken
};
