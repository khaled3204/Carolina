'use strict';

const { sendJson, setCookie, readBody, methodNotAllowed } = require('../../lib/http');
const {
  login,
  sessionCookie,
  clearSessionCookie,
  requireAdmin,
  changeCredentials,
  createResetToken,
  resetPasswordWithToken
} = require('../../lib/auth');
const { loadDb } = require('../../lib/store');
const { sendPasswordResetEmail } = require('../../lib/email');

function getAction(req) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const parts = url.pathname.split('/').filter(Boolean);
  return decodeURIComponent(parts[parts.length - 1] || '');
}

async function handleLogin(req, res) {
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
}

async function handleLogout(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  setCookie(res, clearSessionCookie());
  return sendJson(res, 200, { ok: true });
}

async function handleMe(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const auth = await requireAdmin(req);
  if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

  const db = await loadDb({ fresh: true });
  return sendJson(res, 200, {
    ok: true,
    username: db.credentials.username,
    email: db.credentials.email
  });
}

async function handleCredentials(req, res) {
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
}

async function handleForgotPassword(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const body = await readBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  if (!email) return sendJson(res, 400, { error: 'Email is required' });

  const result = await createResetToken(email);

  if (!result.sent) {
    return sendJson(res, 200, {
      ok: true,
      message: 'If that email is registered, a reset link has been sent.'
    });
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const isLocal = /localhost|127\.0\.0\.1/i.test(host);
  const proto =
    req.headers['x-forwarded-proto'] ||
    (isLocal ? 'http' : 'https');
  const site = (process.env.SITE_URL || '').replace(/\/$/, '') || `${proto}://${host}`;
  const resetUrl = `${site}/admin/?reset=${encodeURIComponent(result.token)}`;

  const mail = await sendPasswordResetEmail({ to: result.email, resetUrl });

  const payload = {
    ok: true,
    message: mail.ok
      ? 'Reset link sent. Check your inbox (and spam folder).'
      : 'Reset link created. Configure GMAIL_APP_PASSWORD on Vercel to receive email.'
  };

  if (!mail.ok && (process.env.NODE_ENV !== 'production' || process.env.EXPOSE_RESET_LINK === '1')) {
    payload.resetUrl = resetUrl;
    payload.emailHint = mail.reason;
  }

  return sendJson(res, 200, payload);
}

async function handleResetPassword(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const body = await readBody(req);
  const result = await resetPasswordWithToken(body.token, body.password, body.username);
  if (!result.ok) return sendJson(res, result.status || 400, { error: result.error });

  return sendJson(res, 200, {
    ok: true,
    username: result.username,
    message: 'Credentials updated. You can sign in now.'
  });
}

const actions = {
  login: handleLogin,
  logout: handleLogout,
  me: handleMe,
  credentials: handleCredentials,
  'forgot-password': handleForgotPassword,
  'reset-password': handleResetPassword
};

module.exports = async function handler(req, res) {
  const action = getAction(req);
  const fn = actions[action];
  if (!fn) return sendJson(res, 404, { error: 'Not found' });
  return fn(req, res);
};
