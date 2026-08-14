'use strict';

const { sendJson, readBody, methodNotAllowed } = require('../http');
const { mutateDb } = require('../store');
const kashier = require('../kashier');

// Kashier calls this URL server-to-server once a payment event happens.
// Configure it in Kashier dashboard > Integrations > your API key > Webhook URL as:
//   https://YOUR-DOMAIN/api/payments/webhook
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!kashier.isConfigured()) return sendJson(res, 503, { error: 'Payment gateway not configured' });

  const body = await readBody(req);
  const receivedSignature = req.headers['x-kashier-signature'];
  const data = body?.data;

  if (!data || !receivedSignature || !kashier.verifyWebhookSignature(data, receivedSignature)) {
    return sendJson(res, 401, { error: 'Invalid signature' });
  }

  const merchantOrderId = data.merchantOrderId;
  if (!merchantOrderId) return sendJson(res, 400, { error: 'Missing order reference' });

  try {
    await mutateDb((db) => {
      const order = (db.orders || []).find((o) => o.id === merchantOrderId);
      if (!order) return;
      if (data.status === 'SUCCESS') {
        order.status = 'paid';
        order.kashierTransactionId = data.transactionId;
      } else if (data.status === 'FAILED' || data.status === 'DECLINED') {
        order.status = 'payment_failed';
      }
    });
  } catch {
    // Still acknowledge receipt even if our own DB write hiccups — Kashier
    // retries on non-2xx responses, and we don't want duplicate charges/emails.
  }

  // Kashier only pays attention to the status code, not the response body.
  return sendJson(res, 200, { received: true });
};
