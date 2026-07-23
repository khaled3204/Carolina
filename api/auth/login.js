'use strict';

const { sendJson, setCookie, readBody, methodNotAllowed } = require('../../lib/http');
const { login, sessionCookie } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const body = await readBody(req);
  const result = await login(body.username, body.password);
  if (!result.ok) return sendJson(res, 401, { error: result.error });

  setCookie(res, sessionCookie(result.token));
  return sendJson(res, 200, {
    ok: true,
    token: result.token,
    username: result.username,
    email: result.email
  });
};
