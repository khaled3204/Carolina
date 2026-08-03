'use strict';

const crypto = require('crypto');
const { loadDb, saveDb, uid } = require('./store');
const { signToken, verifyToken } = require('./auth');

const CODE_TTL_MS = 1000 * 60 * 10; // 10 minutes
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const RESEND_COOLDOWN_MS = 1000 * 45;
const MAX_ATTEMPTS = 5;

function normEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function pruneOtps(db) {
  for (const [key, entry] of Object.entries(db.otps || {})) {
    if (!entry || Date.now() > entry.expiresAt) delete db.otps[key];
  }
}

// Creates (or reuses) a one-time code for the given email and returns it so the
// caller can email it. Rate-limited to avoid spamming an inbox.
async function requestCode(email) {
  const normalized = normEmail(email);
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, error: 'A valid email is required', status: 400 };
  }

  const db = await loadDb();
  pruneOtps(db);

  const existing = db.otps[normalized];
  if (existing && existing.lastSentAt && Date.now() - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt)) / 1000);
    return { ok: false, error: `Please wait ${waitSec}s before requesting another code`, status: 429 };
  }

  const code = generateCode();
  db.otps[normalized] = {
    codeHash: hashCode(code),
    expiresAt: Date.now() + CODE_TTL_MS,
    attempts: 0,
    lastSentAt: Date.now()
  };
  await saveDb(db);

  return { ok: true, email: normalized, code };
}

// Verifies the code, creating the customer account on first success, and
// returns a signed session token for the customer cookie.
async function verifyCode(email, code) {
  const normalized = normEmail(email);
  const db = await loadDb();
  pruneOtps(db);

  const entry = db.otps[normalized];
  if (!entry) return { ok: false, error: 'Request a new code first', status: 400 };
  if (Date.now() > entry.expiresAt) {
    delete db.otps[normalized];
    await saveDb(db);
    return { ok: false, error: 'Code expired — request a new one', status: 400 };
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    delete db.otps[normalized];
    await saveDb(db);
    return { ok: false, error: 'Too many attempts — request a new code', status: 429 };
  }

  const submitted = hashCode(String(code || '').trim());
  const expected = entry.codeHash;
  const match =
    submitted.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(submitted), Buffer.from(expected));

  if (!match) {
    entry.attempts += 1;
    await saveDb(db);
    return { ok: false, error: 'Incorrect code', status: 400 };
  }

  delete db.otps[normalized];

  let customer = db.customers.find((c) => c.email === normalized);
  if (!customer) {
    customer = { id: uid('cus'), email: normalized, createdAt: new Date().toISOString() };
    db.customers.push(customer);
  }
  await saveDb(db);

  const token = signToken({
    sub: customer.id,
    email: customer.email,
    role: 'customer',
    exp: Date.now() + SESSION_TTL_MS
  });

  return { ok: true, token, customer };
}

function customerSessionCookie(token) {
  const secure = process.env.VERCEL || process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `carolina_customer=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(
    SESSION_TTL_MS / 1000
  )}${secure}`;
}

function clearCustomerSessionCookie() {
  const secure = process.env.VERCEL || process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `carolina_customer=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
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

function getCustomerSession(req) {
  const cookies = parseCookies(req);
  const auth = req.headers.authorization || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;
  const payload = verifyToken(bearer || cookies.carolina_customer);
  if (!payload || payload.role !== 'customer') return null;
  return payload;
}

async function requireCustomer(req) {
  const session = getCustomerSession(req);
  if (!session) return { ok: false, error: 'Please sign in first', status: 401 };
  return { ok: true, session };
}

module.exports = {
  requestCode,
  verifyCode,
  customerSessionCookie,
  clearCustomerSessionCookie,
  getCustomerSession,
  requireCustomer
};
