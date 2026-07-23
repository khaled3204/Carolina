'use strict';

const { sendJson, setCookie, methodNotAllowed } = require('../../lib/http');
const { clearSessionCookie } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  setCookie(res, clearSessionCookie());
  return sendJson(res, 200, { ok: true });
};
