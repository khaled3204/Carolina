'use strict';

const { sendJson, readBody, methodNotAllowed } = require('../../lib/http');
const { requireAdmin } = require('../../lib/auth');
const { loadDb, saveDb } = require('../../lib/store');
const { normalizeSale } = require('../../lib/catalog');

module.exports = async function handler(req, res) {
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
};
