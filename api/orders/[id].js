'use strict';

const { sendJson, methodNotAllowed } = require('../../lib/http');
const { requireAdmin } = require('../../lib/auth');
const { loadDb, saveDb } = require('../../lib/store');

function getId(req) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const parts = url.pathname.split('/').filter(Boolean);
  return decodeURIComponent(parts[parts.length - 1] || '');
}

module.exports = async function handler(req, res) {
  const id = getId(req);
  if (!id) return sendJson(res, 400, { error: 'Order id required' });

  if (req.method === 'DELETE') {
    const auth = await requireAdmin(req);
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

    const db = await loadDb();
    const before = db.orders.length;
    db.orders = db.orders.filter((o) => o.id !== id);
    if (db.orders.length === before) return sendJson(res, 404, { error: 'Order not found' });
    await saveDb(db);
    return sendJson(res, 200, { ok: true });
  }

  return methodNotAllowed(res, ['DELETE']);
};
