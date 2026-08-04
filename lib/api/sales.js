'use strict';

const { sendJson, readBody, methodNotAllowed, getResourceId } = require('../http');
const { requireAdmin } = require('../auth');
const { loadDb, mutateDb } = require('../store');
const { normalizeSale } = require('../catalog');

module.exports = async function handler(req, res) {
  const id = getResourceId(req, 'sales');

  if (!id) {
    if (req.method === 'GET') {
      const auth = await requireAdmin(req);
      if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });
      const db = await loadDb({ fresh: true });
      return sendJson(res, 200, { sales: db.sales || [] });
    }

    if (req.method === 'POST') {
      const auth = await requireAdmin(req);
      if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

      const body = await readBody(req);
      const parsed = normalizeSale(body);
      if (parsed.error) return sendJson(res, 400, { error: parsed.error });

      try {
        const sale = await mutateDb((db) => {
          db.sales.unshift(parsed.sale);
          return parsed.sale;
        });
        return sendJson(res, 201, { sale });
      } catch (err) {
        return sendJson(res, 500, { error: err.message || 'Could not save sale' });
      }
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const auth = await requireAdmin(req);
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

    const body = await readBody(req);
    try {
      const sale = await mutateDb((db) => {
        const index = db.sales.findIndex((s) => s.id === id);
        if (index === -1) {
          const err = new Error('Sale not found');
          err.status = 404;
          throw err;
        }
        const parsed = normalizeSale({ ...db.sales[index], ...body }, db.sales[index]);
        if (parsed.error) {
          const err = new Error(parsed.error);
          err.status = 400;
          throw err;
        }
        db.sales[index] = parsed.sale;
        return parsed.sale;
      });
      return sendJson(res, 200, { sale });
    } catch (err) {
      return sendJson(res, err.status || 500, { error: err.message || 'Could not update sale' });
    }
  }

  if (req.method === 'DELETE') {
    const auth = await requireAdmin(req);
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

    try {
      await mutateDb((db) => {
        const before = db.sales.length;
        db.sales = db.sales.filter((s) => s.id !== id);
        if (db.sales.length === before) {
          const err = new Error('Sale not found');
          err.status = 404;
          throw err;
        }
      });
      return sendJson(res, 200, { ok: true });
    } catch (err) {
      return sendJson(res, err.status || 500, { error: err.message || 'Could not delete sale' });
    }
  }

  return methodNotAllowed(res, ['PUT', 'PATCH', 'DELETE']);
};
