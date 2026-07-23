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
    credentials: {
      username: 'carolina',
      passwordSalt: salt,
      passwordHash: hash,
      email: 'shop.carolina.eg@gmail.com'
    },
    products: [],
    sales: [],
    orders: [],
    resetTokens: {}
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
    const res = await fetch(blob.url, { cache: 'no-store' });
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
  db.credentials = { ...base.credentials, ...(raw?.credentials || {}) };
  db.products = Array.isArray(raw?.products) ? raw.products : base.products;
  db.sales = Array.isArray(raw?.sales) ? raw.sales : [];
  db.orders = Array.isArray(raw?.orders) ? raw.orders : [];
  db.resetTokens = raw?.resetTokens && typeof raw.resetTokens === 'object' ? raw.resetTokens : {};

  if (!db.credentials.passwordHash || !db.credentials.passwordSalt) {
    const { salt, hash } = scryptHash('carolina123123');
    db.credentials.passwordSalt = salt;
    db.credentials.passwordHash = hash;
    db.credentials.username = db.credentials.username || 'carolina';
    db.credentials.email = db.credentials.email || 'shop.carolina.eg@gmail.com';
  }
  return db;
}

async function loadDb() {
  if (globalThis.__carolinaDbCache) {
    return globalThis.__carolinaDbCache;
  }

  let raw = await readFromBlob();
  if (!raw) raw = readJsonFile(DB_PATH);
  if (!raw) raw = readJsonFile(SEED_PATH);
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
  globalThis.__carolinaDbCache = db;
  const wroteBlob = await writeToBlob(db);
  try {
    writeJsonFile(DB_PATH, db);
  } catch {
    // read-only filesystem on some hosts — Blob / memory still hold data
  }
  return wroteBlob;
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
  uid,
  slugify,
  normalizeDb
};
