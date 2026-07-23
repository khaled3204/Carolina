'use strict';

const { sendJson, readBody, methodNotAllowed } = require('../../lib/http');
const { requireAdmin } = require('../../lib/auth');
const { loadDb, saveDb, uid } = require('../../lib/store');
const { normalizeProduct, applySales } = require('../../lib/catalog');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const db = await loadDb();
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const includeInactive = url.searchParams.get('all') === '1';
    if (includeInactive) {
      const auth = await requireAdmin(req);
      if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });
    }
    let products = db.products || [];
    if (!includeInactive) products = products.filter((p) => p.active !== false);
    products = applySales(products, db.sales);
    return sendJson(res, 200, { products });
  }

  if (req.method === 'POST') {
    const auth = await requireAdmin(req);
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

    const body = await readBody(req);
    const parsed = normalizeProduct(body);
    if (parsed.error) return sendJson(res, 400, { error: parsed.error });

    const db = await loadDb();
    if (db.products.some((p) => p.id === parsed.product.id)) {
      parsed.product.id = `${parsed.product.id}-${uid('x').slice(-4)}`;
    }
    db.products.unshift(parsed.product);
    await saveDb(db);
    return sendJson(res, 201, { product: parsed.product });
  }

  return methodNotAllowed(res, ['GET', 'POST']);
};
