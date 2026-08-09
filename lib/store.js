'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
const SEED_PATH = path.join(process.cwd(), 'data', 'seed.json');
const BLOB_PATHNAME = 'carolina-db.json';

function scryptHash(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const check = crypto.scryptSync(String(password), salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(check, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

function defaultSeed() {
  const { salt, hash } = scryptHash('carolina123123');
  return {
    __v: 0,
    credentials: {
      username: 'carolina',
      passwordSalt: salt,
      passwordHash: hash,
      email: 'shop.carolina.eg@gmail.com'
    },
    products: [],
    sales: [],
    orders: [],
    resetTokens: {},
    customers: [],
    otps: {},
    coupons: []
  };
}

function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function writeJsonFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function onVercel() {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

async function readFromBlob() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  try {
    const listRes = await fetch(`https://blob.vercel-storage.com?prefix=${encodeURIComponent(BLOB_PATHNAME)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!listRes.ok) return null;
    const listed = await listRes.json();
    const blob = (listed.blobs || []).find((b) => b.pathname === BLOB_PATHNAME);
    if (!blob?.url) return null;
    // Vercel Blob serves overwritten pathnames from its CDN cache for up to 60s.
    // Since this file is overwritten on every order/edit, appending cache=0
    // forces a direct read from origin storage so we always get the latest save.
    const freshUrl = `${blob.url}${blob.url.includes('?') ? '&' : '?'}cache=0`;
    const res = await fetch(freshUrl, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function writeToBlob(data) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`https://blob.vercel-storage.com/${BLOB_PATHNAME}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-vercel-blob-access': 'private',
        'x-vercel-blob-allow-overwrite': 'true'
      },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch {
    return false;
  }
}

function normalizeDb(raw) {
  const base = defaultSeed();
  const db = { ...base, ...(raw || {}) };
  db.__v = Number.isFinite(Number(raw?.__v)) ? Number(raw.__v) : 0;
  db.credentials = { ...base.credentials, ...(raw?.credentials || {}) };
  db.products = Array.isArray(raw?.products) ? raw.products : base.products;
  db.sales = Array.isArray(raw?.sales) ? raw.sales : [];
  db.orders = Array.isArray(raw?.orders) ? raw.orders : [];
  db.resetTokens = raw?.resetTokens && typeof raw.resetTokens === 'object' ? raw.resetTokens : {};
  db.customers = Array.isArray(raw?.customers) ? raw.customers : [];
  db.otps = raw?.otps && typeof raw.otps === 'object' ? raw.otps : {};
  db.coupons = Array.isArray(raw?.coupons) ? raw.coupons : [];

  if (!db.credentials.passwordHash || !db.credentials.passwordSalt) {
    const { salt, hash } = scryptHash('carolina123123');
    db.credentials.passwordSalt = salt;
    db.credentials.passwordHash = hash;
    db.credentials.username = db.credentials.username || 'carolina';
    db.credentials.email = db.credentials.email || 'shop.carolina.eg@gmail.com';
  }
  return db;
}

async function loadDb({ fresh = false } = {}) {
  if (!fresh && globalThis.__carolinaDbCache) {
    // Prefer Blob when configured so cold instances don't serve stale memory.
    if (!blobConfigured()) return globalThis.__carolinaDbCache;
  }

  let raw = await readFromBlob();
  if (!raw) raw = readJsonFile(DB_PATH);
  if (!raw) raw = readJsonFile(SEED_PATH);
  if (!raw && globalThis.__carolinaDbCache) {
    // Blob and disk were both unreachable — keep last known state instead of wiping.
    return globalThis.__carolinaDbCache;
  }
  if (!raw) raw = defaultSeed();

  const db = normalizeDb(raw);
  if (!db.products.length) {
    const seed = readJsonFile(SEED_PATH);
    if (seed?.products?.length) db.products = seed.products;
  }

  // Migrate legacy default username admin → carolina when still on the default password
  if (
    String(db.credentials.username || '').toLowerCase() === 'admin' &&
    verifyPassword('carolina123123', db.credentials.passwordSalt, db.credentials.passwordHash)
  ) {
    db.credentials.username = 'carolina';
    db.credentials.email = db.credentials.email || 'shop.carolina.eg@gmail.com';
  }

  globalThis.__carolinaDbCache = db;
  return db;
}

async function saveDb(db) {
  if (!db || typeof db !== 'object') {
    throw new Error('Cannot save empty database');
  }
  if (!db.resetTokens || typeof db.resetTokens !== 'object') db.resetTokens = {};
  if (!db.otps || typeof db.otps !== 'object') db.otps = {};
  db.__v = (Number(db.__v) || 0) + 1;

  globalThis.__carolinaDbCache = db;

  if (onVercel() && !blobConfigured()) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN is missing. Create a Blob store in the Vercel dashboard and add the token — without it orders, stock, and admin changes are lost.'
    );
  }

  const wroteBlob = await writeToBlob(db);
  if (blobConfigured() && !wroteBlob) {
    throw new Error('Could not save data to Vercel Blob. Check BLOB_READ_WRITE_TOKEN and try again.');
  }

  try {
    writeJsonFile(DB_PATH, db);
  } catch {
    // read-only filesystem on some hosts — Blob / memory still hold data
  }
  return wroteBlob || !blobConfigured();
}

// Serialize read-modify-write within one serverless instance and retry on version conflicts.
let writeChain = Promise.resolve();

async function mutateDb(mutator) {
  const run = async () => {
    let lastError = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const db = await loadDb({ fresh: true });
        const before = Number(db.__v) || 0;
        const result = await mutator(db);
        await saveDb(db);

        if (blobConfigured()) {
          const check = await readFromBlob();
          const after = Number(check?.__v) || 0;
          if (check && after < before + 1) {
            lastError = new Error('Concurrent write detected');
            continue;
          }
          if (check && after > (Number(db.__v) || 0)) {
            lastError = new Error('Concurrent write detected');
            continue;
          }
        }
        return result === undefined ? db : result;
      } catch (err) {
        // Client/validation errors should not be retried.
        if (err && err.status && err.status >= 400 && err.status < 500) throw err;
        lastError = err;
        if (attempt === 3) throw err;
      }
    }
    throw lastError || new Error('Could not save — please try again');
  };

  const next = writeChain.then(run, run);
  writeChain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

function uid(prefix = 'id') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || uid('item');
}

module.exports = {
  scryptHash,
  verifyPassword,
  loadDb,
  saveDb,
  mutateDb,
  uid,
  slugify,
  normalizeDb,
  blobConfigured,
  onVercel
};
