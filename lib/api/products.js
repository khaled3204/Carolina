'use strict';

const { sendJson, readBody, methodNotAllowed, getResourceId } = require('../http');
const { requireAdmin } = require('../auth');
const { loadDb, mutateDb, uid } = require('../store');
const { normalizeProduct, applySales } = require('../catalog');

module.exports = async function handler(req, res) {
  const id = getResourceId(req, 'products');

  if (!id) {
    if (req.method === 'GET') {
      const db = await loadDb({ fresh: true });
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

      try {
        const product = await mutateDb((db) => {
          if (db.products.some((p) => p.id === parsed.product.id)) {
            parsed.product.id = `${parsed.product.id}-${uid('x').slice(-4)}`;
          }
          db.products.unshift(parsed.product);
          return parsed.product;
        });
        return sendJson(res, 201, { product });
      } catch (err) {
        return sendJson(res, 500, { error: err.message || 'Could not save product' });
      }
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  }

  if (req.method === 'GET') {
    const db = await loadDb({ fresh: true });
    const product = (db.products || []).find((p) => p.id === id);
    if (!product) return sendJson(res, 404, { error: 'Product not found' });
    const [withSale] = applySales([product], db.sales);
    return sendJson(res, 200, { product: withSale });
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const auth = await requireAdmin(req);
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

    const body = await readBody(req);
    try {
      const product = await mutateDb((db) => {
        const index = db.products.findIndex((p) => p.id === id);
        if (index === -1) {
          const err = new Error('Product not found');
          err.status = 404;
          throw err;
        }
        const parsed = normalizeProduct({ ...db.products[index], ...body, id }, db.products[index]);
        if (parsed.error) {
          const err = new Error(parsed.error);
          err.status = 400;
          throw err;
        }
        db.products[index] = parsed.product;
        return parsed.product;
      });
      return sendJson(res, 200, { product });
    } catch (err) {
      return sendJson(res, err.status || 500, { error: err.message || 'Could not update product' });
    }
  }

  if (req.method === 'DELETE') {
    const auth = await requireAdmin(req);
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

    try {
      await mutateDb((db) => {
        const before = db.products.length;
        db.products = db.products.filter((p) => p.id !== id);
        if (db.products.length === before) {
          const err = new Error('Product not found');
          err.status = 404;
          throw err;
        }
      });
      return sendJson(res, 200, { ok: true });
    } catch (err) {
      return sendJson(res, err.status || 500, { error: err.message || 'Could not delete product' });
    }
  }

  return methodNotAllowed(res, ['GET', 'PUT', 'PATCH', 'DELETE']);
};
