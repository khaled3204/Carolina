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

function siteOrigin(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const isLocal = /localhost|127\.0\.0\.1/i.test(host);
  const proto = req.headers['x-forwarded-proto'] || (isLocal ? 'http' : 'https');
  return (process.env.SITE_URL || '').replace(/\/$/, '') || `${proto}://${host}`;
}

async function handleRequestCode(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const body = await readBody(req);
  const result = await requestCode(body.email);
  if (!result.ok) return sendJson(res, result.status || 400, { error: result.error });

  const adminUrl = result.isAdmin ? `${siteOrigin(req)}/admin/` : null;
  const mail = await sendVerificationCodeEmail({
    to: result.email,
    code: result.code,
    isAdmin: result.isAdmin,
    adminUrl
  });

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
    customer: { email: result.customer.email, id: result.customer.id, isAdmin: result.isAdmin }
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
  return sendJson(res, 200, {
    ok: true,
    customer: { email: auth.session.email, id: auth.session.sub, isAdmin: Boolean(auth.session.isAdmin) }
  });
}

async function handleOrders(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const auth = await requireCustomer(req);
  if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

  const db = await loadDb({ fresh: true });

  // The shop's own admin email gets the full order list here too — not just
  // whatever orders happen to be under that address — so it doubles as a
  // quick, on-the-go view without opening the full admin panel.
  if (auth.session.isAdmin) {
    return sendJson(res, 200, { orders: db.orders || [] });
  }

  const email = String(auth.session.email || '').toLowerCase();
  const customerId = auth.session.sub;
  const orders = (db.orders || []).filter((o) => {
    const orderEmail = String(o.shipping?.email || '').toLowerCase();
    return o.customerId === customerId || orderEmail === email;
  });
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
