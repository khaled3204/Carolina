'use strict';

/**
 * Kashier Hosted Payment Page (HPP) integration.
 *
 * Kashier is an Egyptian payment gateway for accepting Visa/Mastercard (and
 * other local methods, if you enable them in the Kashier dashboard) on a
 * single merchant account. This module builds the redirect link to Kashier's
 * hosted checkout page, and verifies the signature on Kashier's webhook so we
 * know a payment notification really came from Kashier.
 *
 * Full setup guide: see PAYMENT_SETUP_GUIDE.md in the project root.
 *
 * Required environment variables (set these in .env / Vercel project settings):
 *   KASHIER_MERCHANT_ID  - your Merchant ID from the Kashier dashboard (looks like "MID-XXXX-XXXX")
 *   KASHIER_API_KEY      - your "Payment API Key" from Kashier dashboard > Integrations
 *                            (used both to sign the order hash and to verify webhook signatures)
 *   KASHIER_MODE          - "test" while testing, "live" once you're ready to accept real payments
 */

const crypto = require('crypto');

function isConfigured() {
  return Boolean(process.env.KASHIER_MERCHANT_ID && process.env.KASHIER_API_KEY);
}

function isLive() {
  return String(process.env.KASHIER_MODE || 'test').toLowerCase() === 'live';
}

function baseUrl() {
  return isLive() ? 'https://iframe.kashier.io' : 'https://test-iframe.kashier.io';
}

// Kashier wants a plain decimal amount string (e.g. "149.50"), not cents.
function formatAmount(amount) {
  return (Math.round(Number(amount || 0) * 100) / 100).toFixed(2);
}

/**
 * Order hash required by Kashier to trust the amount/currency/order weren't
 * tampered with client-side. HMAC-SHA256 of "/?payment=MID.orderId.amount.currency",
 * signed with the Payment API Key. See Kashier's Integration Guide.
 */
function buildOrderHash({ orderId, amount, currency }) {
  const mid = process.env.KASHIER_MERCHANT_ID;
  const path = `/?payment=${mid}.${orderId}.${amount}.${currency}`;
  return crypto.createHmac('sha256', process.env.KASHIER_API_KEY || '').update(path).digest('hex');
}

/**
 * Builds the URL to redirect the shopper to for a card payment. Kashier hosts
 * the actual card-entry form there, so raw card numbers never touch our own
 * server (required for PCI compliance).
 */
function startCardPayment({ merchantOrderId, amount, currency, redirectUrl, billing }) {
  const mid = process.env.KASHIER_MERCHANT_ID;
  const formattedAmount = formatAmount(amount);
  const orderCurrency = currency || 'EGP';
  const hash = buildOrderHash({ orderId: merchantOrderId, amount: formattedAmount, currency: orderCurrency });

  const params = new URLSearchParams({
    mid,
    orderId: merchantOrderId,
    amount: formattedAmount,
    currency: orderCurrency,
    hash,
    merchantRedirect: redirectUrl,
    allowedMethods: 'card',
    display: 'en'
  });
  if (billing?.email) params.set('customerEmail', billing.email);

  return {
    paymentUrl: `${baseUrl()}/payment?${params.toString()}`
  };
}

/**
 * Verifies the `x-kashier-signature` header on an incoming webhook payload.
 * Kashier tells us, per-event, which fields of `data` were used to build the
 * signature (`data.signatureKeys`) — sort those keys alphabetically, build a
 * `key=value&key2=value2...` string from just those fields, and HMAC-SHA256
 * it with the Payment API Key. See Kashier's Webhook docs.
 */
function verifyWebhookSignature(data, receivedSignature) {
  if (!data || !Array.isArray(data.signatureKeys) || !receivedSignature) return false;
  const keys = [...data.signatureKeys].sort();
  const payload = keys.map((key) => `${key}=${data[key]}`).join('&');
  const computed = crypto
    .createHmac('sha256', process.env.KASHIER_API_KEY || '')
    .update(payload)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(receivedSignature));
  } catch {
    return false;
  }
}

module.exports = {
  isConfigured,
  isLive,
  startCardPayment,
  verifyWebhookSignature
};
