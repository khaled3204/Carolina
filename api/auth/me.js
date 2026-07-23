'use strict';

const { sendJson, methodNotAllowed } = require('../../lib/http');
const { requireAdmin } = require('../../lib/auth');
const { loadDb } = require('../../lib/store');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const auth = await requireAdmin(req);
  if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

  const db = await loadDb();
  return sendJson(res, 200, {
    ok: true,
    username: db.credentials.username,
    email: db.credentials.email
  });
};
