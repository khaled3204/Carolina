'use strict';

const { sendJson, readBody, methodNotAllowed } = require('../../lib/http');
const { requireAdmin } = require('../../lib/auth');
const { loadDb, saveDb } = require('../../lib/store');
const { normalizeSale } = require('../../lib/catalog');

function getId(req) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const parts = url.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('sales');
  const rest = idx !== -1 ? parts.slice(idx + 1) : [];
  return rest.length ? decodeURIComponent(rest[rest.length - 1]) : null;
}

module.exports = async function handler(req, res) {
  const id = getId(req);

  if (!id) {
    if (req.method === 'GET') {
      const auth = await requireAdmin(req);
      if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });
      const db = await loadDb();
      return sendJson(res, 200, { sales: db.sales || [] });
    }

    if (req.method === 'POST') {
      const auth = await requireAdmin(req);
      if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

      const body = await readBody(req);
      const parsed = normalizeSale(body);
      if (parsed.error) return sendJson(res, 400, { error: parsed.error });

      const db = await loadDb();
      db.sales.unshift(parsed.sale);
      await saveDb(db);
      return sendJson(res, 201, { sale: parsed.sale });
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const auth = await requireAdmin(req);
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

    const db = await loadDb();
    const index = db.sales.findIndex((s) => s.id === id);
    if (index === -1) return sendJson(res, 404, { error: 'Sale not found' });

    const body = await readBody(req);
    const parsed = normalizeSale({ ...db.sales[index], ...body }, db.sales[index]);
    if (parsed.error) return sendJson(res, 400, { error: parsed.error });

    db.sales[index] = parsed.sale;
    await saveDb(db);
    return sendJson(res, 200, { sale: parsed.sale });
  }

  if (req.method === 'DELETE') {
    const auth = await requireAdmin(req);
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

    const db = await loadDb();
    const before = db.sales.length;
    db.sales = db.sales.filter((s) => s.id !== id);
    if (db.sales.length === before) return sendJson(res, 404, { error: 'Sale not found' });
    await saveDb(db);
    return sendJson(res, 200, { ok: true });
  }

  return methodNotAllowed(res, ['PUT', 'PATCH', 'DELETE']);
};
