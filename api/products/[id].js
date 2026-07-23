'use strict';

const { sendJson, readBody, methodNotAllowed } = require('../../lib/http');
const { requireAdmin } = require('../../lib/auth');
const { loadDb, saveDb } = require('../../lib/store');
const { normalizeProduct, applySales } = require('../../lib/catalog');

function getId(req) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const parts = url.pathname.split('/').filter(Boolean);
  return decodeURIComponent(parts[parts.length - 1] || '');
}

module.exports = async function handler(req, res) {
  const id = getId(req);
  if (!id) return sendJson(res, 400, { error: 'Product id required' });

  if (req.method === 'GET') {
    const db = await loadDb();
    const product = (db.products || []).find((p) => p.id === id);
    if (!product) return sendJson(res, 404, { error: 'Product not found' });
    const [withSale] = applySales([product], db.sales);
    return sendJson(res, 200, { product: withSale });
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const auth = await requireAdmin(req);
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

    const db = await loadDb();
    const index = db.products.findIndex((p) => p.id === id);
    if (index === -1) return sendJson(res, 404, { error: 'Product not found' });

    const body = await readBody(req);
    const parsed = normalizeProduct({ ...db.products[index], ...body, id }, db.products[index]);
    if (parsed.error) return sendJson(res, 400, { error: parsed.error });

    db.products[index] = parsed.product;
    await saveDb(db);
    return sendJson(res, 200, { product: parsed.product });
  }

  if (req.method === 'DELETE') {
    const auth = await requireAdmin(req);
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

    const db = await loadDb();
    const before = db.products.length;
    db.products = db.products.filter((p) => p.id !== id);
    if (db.products.length === before) return sendJson(res, 404, { error: 'Product not found' });
    await saveDb(db);
    return sendJson(res, 200, { ok: true });
  }

  return methodNotAllowed(res, ['GET', 'PUT', 'PATCH', 'DELETE']);
};
