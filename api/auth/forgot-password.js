'use strict';

const { sendJson, readBody, methodNotAllowed } = require('../../lib/http');
const { createResetToken } = require('../../lib/auth');
const { sendPasswordResetEmail } = require('../../lib/email');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const body = await readBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  if (!email) return sendJson(res, 400, { error: 'Email is required' });

  const result = await createResetToken(email);

  // Always return success-shaped response when email matches or not
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

  // Helpful when email is not yet configured (local / first deploy)
  if (!mail.ok && (process.env.NODE_ENV !== 'production' || process.env.EXPOSE_RESET_LINK === '1')) {
    payload.resetUrl = resetUrl;
    payload.emailHint = mail.reason;
  }

  return sendJson(res, 200, payload);
};
