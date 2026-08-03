'use strict';

const { sendJson, setCookie, readBody, methodNotAllowed } = require('../../lib/http');
const {
  requestCode,
  verifyCode,
  customerSessionCookie,
  clearCustomerSessionCookie,
  requireCustomer
} = require('../../lib/customers');
const { loadDb } = require('../../lib/store');
const { sendVerificationCodeEmail } = require('../../lib/email');

function getAction(req) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const parts = url.pathname.split('/').filter(Boolean);
  return decodeURIComponent(parts[parts.length - 1] || '');
}

async function handleRequestCode(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const body = await readBody(req);
  const result = await requestCode(body.email);
  if (!result.ok) return sendJson(res, result.status || 400, { error: result.error });

  const mail = await sendVerificationCodeEmail({ to: result.email, code: result.code });

  const payload = {
    ok: true,
    message: mail.ok
      ? 'Verification code sent — check your inbox (and spam folder).'
      : 'Code created. Configure GMAIL_APP_PASSWORD on the server to actually receive email.'
  };

  // Local/dev convenience: if email isn't configured, surface the code so testing isn't blocked.
  if (!mail.ok && (process.env.NODE_ENV !== 'production' || process.env.EXPOSE_RESET_LINK === '1')) {
    payload.devCode = result.code;
    payload.emailHint = mail.reason;
  }

  return sendJson(res, 200, payload);
}

async function handleVerifyCode(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const body = await readBody(req);
  const result = await verifyCode(body.email, body.code);
  if (!result.ok) return sendJson(res, result.status || 400, { error: result.error });

  setCookie(res, customerSessionCookie(result.token));
  return sendJson(res, 200, {
    ok: true,
    token: result.token,
    customer: { email: result.customer.email, id: result.customer.id }
  });
}

async function handleLogout(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  setCookie(res, clearCustomerSessionCookie());
  return sendJson(res, 200, { ok: true });
}

async function handleMe(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const auth = await requireCustomer(req);
  if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });
  return sendJson(res, 200, { ok: true, customer: { email: auth.session.email, id: auth.session.sub } });
}

async function handleOrders(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const auth = await requireCustomer(req);
  if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

  const db = await loadDb();
  const email = String(auth.session.email || '').toLowerCase();
  const orders = (db.orders || []).filter(
    (o) => String(o.shipping?.email || '').toLowerCase() === email
  );
  return sendJson(res, 200, { orders });
}

const actions = {
  'request-code': handleRequestCode,
  'verify-code': handleVerifyCode,
  logout: handleLogout,
  me: handleMe,
  orders: handleOrders
};

module.exports = async function handler(req, res) {
  const action = getAction(req);
  const fn = actions[action];
  if (!fn) return sendJson(res, 404, { error: 'Not found' });
  return fn(req, res);
};
