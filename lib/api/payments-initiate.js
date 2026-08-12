'use strict';

const { sendJson, readBody, methodNotAllowed } = require('../http');
const { loadDb } = require('../store');
const paymob = require('../paymob');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  if (!paymob.isConfigured()) {
    return sendJson(res, 503, {
      error:
        'Card / InstaPay payment is not set up yet. Add your Paymob credentials as environment variables — see PAYMENT_SETUP_GUIDE.md.'
    });
  }

  const body = await readBody(req);
  const orderId = String(body.orderId || '');
  const walletNumber = String(body.walletNumber || '').trim();
  if (!orderId) return sendJson(res, 400, { error: 'Missing orderId' });

  const db = await loadDb({ fresh: true });
  const order = (db.orders || []).find((o) => o.id === orderId);
  if (!order) return sendJson(res, 404, { error: 'Order not found' });
  if (order.status !== 'pending_payment') {
    return sendJson(res, 400, { error: 'This order is not awaiting payment' });
  }

  const amountCents = Math.round(Number(order.total) * 100);
  const billing = order.shipping;

  try {
    let result;
    if (order.paymentMethod === 'card') {
      result = await paymob.startCardPayment({
        merchantOrderId: order.id,
        amountCents,
        items: order.items,
        billing
      });
    } else if (order.paymentMethod === 'instapay') {
      if (!walletNumber) return sendJson(res, 400, { error: 'Missing wallet / InstaPay mobile number' });
      result = await paymob.startWalletPayment({
        merchantOrderId: order.id,
        amountCents,
        items: order.items,
        billing,
        walletNumber
      });
    } else {
      return sendJson(res, 400, { error: 'This order does not require online payment' });
    }

    if (!result.paymentUrl) {
      return sendJson(res, 502, { error: 'Payment gateway did not return a payment link' });
    }

    return sendJson(res, 200, { paymentUrl: result.paymentUrl });
  } catch (err) {
    return sendJson(res, err.status || 500, { error: err.message || 'Could not start payment' });
  }
};
