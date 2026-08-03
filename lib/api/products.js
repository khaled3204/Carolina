'use strict';

const { sendJson, readBody, methodNotAllowed, getResourceId } = require('../http');
const { requireAdmin } = require('../auth');
const { loadDb, saveDb, uid } = require('../store');
const { normalizeProduct, applySales } = require('../catalog');

module.exports = async function handler(req, res) {
  const id = getResourceId(req, 'products');

  if (!id) {
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
  }

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
