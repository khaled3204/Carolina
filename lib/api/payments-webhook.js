'use strict';

const { sendJson, readBody, methodNotAllowed } = require('../http');
const { mutateDb } = require('../store');
const paymob = require('../paymob');

// Paymob calls this URL server-to-server once a transaction is processed.
// Configure it in Paymob dashboard > Developers > Payment Callbacks as:
//   https://YOUR-DOMAIN/api/payments/webhook
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!paymob.isConfigured()) return sendJson(res, 503, { error: 'Payment gateway not configured' });

  const body = await readBody(req);
  const receivedHmac = req.query?.hmac || new URL(req.url, 'http://x').searchParams.get('hmac');
  const obj = body?.obj;

  if (!obj || !receivedHmac || !paymob.verifyWebhookHmac(obj, receivedHmac)) {
    return sendJson(res, 401, { error: 'Invalid signature' });
  }

  const merchantOrderId = obj.order?.merchant_order_id;
  if (!merchantOrderId) return sendJson(res, 400, { error: 'Missing order reference' });

  try {
    await mutateDb((db) => {
      const order = (db.orders || []).find((o) => o.id === merchantOrderId);
      if (!order) return;
      if (obj.success === true && obj.pending !== true) {
        order.status = 'paid';
        order.paymobTransactionId = obj.id;
      } else if (obj.success === false) {
        order.status = 'payment_failed';
      }
    });
  } catch {
    // Still acknowledge receipt to Paymob even if our own DB write hiccups —
    // Paymob retries on non-200, and we don't want duplicate charges/emails.
  }

  return sendJson(res, 200, { received: true });
};
