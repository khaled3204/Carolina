'use strict';

const { sendJson, readBody, methodNotAllowed } = require('../http');
const { loadDb } = require('../store');
const kashier = require('../kashier');

function siteOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  return `${proto}://${host}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  if (!kashier.isConfigured()) {
    return sendJson(res, 503, {
      error:
        'Card payment is not set up yet. Add your Kashier credentials as environment variables — see PAYMENT_SETUP_GUIDE.md.'
    });
  }

  const body = await readBody(req);
  const orderId = String(body.orderId || '');
  if (!orderId) return sendJson(res, 400, { error: 'Missing orderId' });

  const db = await loadDb({ fresh: true });
  const order = (db.orders || []).find((o) => o.id === orderId);
  if (!order) return sendJson(res, 404, { error: 'Order not found' });
  if (order.status !== 'pending_payment') {
    return sendJson(res, 400, { error: 'This order is not awaiting payment' });
  }
  if (order.paymentMethod !== 'card') {
    return sendJson(res, 400, { error: 'This order does not require online payment' });
  }

  try {
    const redirectUrl = `${siteOrigin(req)}/payment.html?orderId=${encodeURIComponent(order.id)}`;
    const result = kashier.startCardPayment({
      merchantOrderId: order.id,
      amount: order.total,
      currency: 'EGP',
      redirectUrl,
      billing: order.shipping
    });

    if (!result.paymentUrl) {
      return sendJson(res, 502, { error: 'Payment gateway did not return a payment link' });
    }

    return sendJson(res, 200, { paymentUrl: result.paymentUrl });
  } catch (err) {
    return sendJson(res, err.status || 500, { error: err.message || 'Could not start payment' });
  }
};
