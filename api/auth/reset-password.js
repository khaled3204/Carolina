'use strict';

const { sendJson, readBody, methodNotAllowed } = require('../../lib/http');
const { resetPasswordWithToken } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const body = await readBody(req);
  const result = await resetPasswordWithToken(body.token, body.password, body.username);
  if (!result.ok) return sendJson(res, result.status || 400, { error: result.error });

  return sendJson(res, 200, {
    ok: true,
    username: result.username,
    message: 'Credentials updated. You can sign in now.'
  });
};
