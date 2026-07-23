'use strict';

const { sendJson, setCookie, readBody, methodNotAllowed } = require('../../lib/http');
const { requireAdmin, changeCredentials, sessionCookie } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'PUT' && req.method !== 'POST') {
    return methodNotAllowed(res, ['PUT', 'POST']);
  }

  const auth = await requireAdmin(req);
  if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

  const body = await readBody(req);
  const result = await changeCredentials({
    username: body.username,
    password: body.password,
    email: body.email,
    currentPassword: body.currentPassword
  });

  if (!result.ok) return sendJson(res, result.status || 400, { error: result.error });

  setCookie(res, sessionCookie(result.token));
  return sendJson(res, 200, {
    ok: true,
    token: result.token,
    username: result.username,
    email: result.email
  });
};
