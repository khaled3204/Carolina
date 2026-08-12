'use strict';

/**
 * Paymob "Accept" API integration.
 *
 * Paymob is the standard Egyptian payment gateway for accepting Visa/Mastercard
 * and mobile wallets (Vodafone Cash, Orange Money, Etisalat Cash, InstaPay) on
 * a single merchant account. This module wraps the three calls needed to start
 * a payment, and the HMAC check needed to trust Paymob's webhook.
 *
 * Full setup guide: see PAYMENT_SETUP_GUIDE.md in the project root.
 *
 * Required environment variables (set these in .env / Vercel project settings):
 *   PAYMOB_API_KEY              - from Paymob dashboard > Settings > Account Info
 *   PAYMOB_CARD_INTEGRATION_ID  - the Integration ID of your "Online Card" integration
 *   PAYMOB_WALLET_INTEGRATION_ID- the Integration ID of your "Mobile Wallet" integration (covers InstaPay/wallet pay)
 *   PAYMOB_IFRAME_ID            - the Iframe ID linked to your card integration
 *   PAYMOB_HMAC_SECRET          - HMAC secret from Paymob dashboard > Settings > Payment Integrations
 */

const BASE_URL = 'https://accept.paymob.com/api';

function isConfigured() {
  return Boolean(
    process.env.PAYMOB_API_KEY &&
      process.env.PAYMOB_CARD_INTEGRATION_ID &&
      process.env.PAYMOB_WALLET_INTEGRATION_ID &&
      process.env.PAYMOB_IFRAME_ID &&
      process.env.PAYMOB_HMAC_SECRET
  );
}

async function paymobFetch(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || data?.detail || `Paymob request failed (${res.status})`;
    const err = new Error(message);
    err.status = 502;
    err.paymob = data;
    throw err;
  }
  return data;
}

async function getAuthToken() {
  const data = await paymobFetch('/auth/tokens', { api_key: process.env.PAYMOB_API_KEY });
  return data.token;
}

async function registerOrder(authToken, { merchantOrderId, amountCents, items }) {
  const data = await paymobFetch('/ecommerce/orders', {
    auth_token: authToken,
    delivery_needed: false,
    amount_cents: amountCents,
    currency: 'EGP',
    merchant_order_id: merchantOrderId,
    items: (items || []).map((i) => ({
      name: String(i.name || '').slice(0, 60),
      amount_cents: Math.round(Number(i.unitPrice || 0) * 100),
      quantity: i.qty || 1
    }))
  });
  return data.id;
}

async function getPaymentKey(authToken, { paymobOrderId, amountCents, integrationId, billing }) {
  const data = await paymobFetch('/acceptance/payment_keys', {
    auth_token: authToken,
    amount_cents: amountCents,
    expiration: 3600,
    order_id: paymobOrderId,
    billing_data: {
      first_name: billing.firstName || 'NA',
      last_name: billing.lastName || 'NA',
      email: billing.email || 'na@example.com',
      phone_number: billing.phone || 'NA',
      country: 'EG',
      city: billing.city || 'NA',
      state: billing.region || 'NA',
      street: billing.address || 'NA',
      building: 'NA',
      floor: 'NA',
      apartment: 'NA',
      postal_code: billing.postal || 'NA'
    },
    currency: 'EGP',
    integration_id: integrationId
  });
  return data.token;
}

/**
 * Starts a card payment. Returns the iframe URL to redirect the shopper to —
 * Paymob hosts the actual card-entry form there, so raw card numbers never
 * touch our own server (required for PCI compliance).
 */
async function startCardPayment({ merchantOrderId, amountCents, items, billing }) {
  const authToken = await getAuthToken();
  const paymobOrderId = await registerOrder(authToken, { merchantOrderId, amountCents, items });
  const paymentToken = await getPaymentKey(authToken, {
    paymobOrderId,
    amountCents,
    integrationId: process.env.PAYMOB_CARD_INTEGRATION_ID,
    billing
  });
  const iframeId = process.env.PAYMOB_IFRAME_ID;
  return {
    paymentUrl: `${BASE_URL}/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`,
    paymobOrderId
  };
}

/**
 * Starts an InstaPay / mobile-wallet payment. `walletNumber` is the shopper's
 * wallet-linked mobile number. Returns a redirect_url that shows Paymob's
 * hosted OTP/confirmation screen for that wallet.
 */
async function startWalletPayment({ merchantOrderId, amountCents, items, billing, walletNumber }) {
  const authToken = await getAuthToken();
  const paymobOrderId = await registerOrder(authToken, { merchantOrderId, amountCents, items });
  const paymentToken = await getPaymentKey(authToken, {
    paymobOrderId,
    amountCents,
    integrationId: process.env.PAYMOB_WALLET_INTEGRATION_ID,
    billing
  });

  const res = await fetch(`${BASE_URL}/acceptance/payments/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: { identifier: walletNumber, subtype: 'WALLET' },
      payment_token: paymentToken
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || 'Could not start wallet payment');
    err.status = 502;
    throw err;
  }
  return {
    paymentUrl: data.redirect_url || data.iframe_redirection_url || null,
    paymobOrderId
  };
}

/**
 * Verifies the HMAC on a Paymob transaction-processed webhook payload.
 * Paymob signs a specific, ordered subset of the `obj` fields — see their
 * "Transaction Processed Callback" docs for the exact field order, since it
 * is not alphabetical and differs from the redirect (response) HMAC.
 */
function verifyWebhookHmac(obj, receivedHmac) {
  const crypto = require('crypto');
  const orderedKeys = [
    'amount_cents',
    'created_at',
    'currency',
    'error_occured',
    'has_parent_transaction',
    'id',
    'integration_id',
    'is_3d_secure',
    'is_auth',
    'is_capture',
    'is_refunded',
    'is_standalone_payment',
    'is_voided',
    'order.id',
    'owner',
    'pending',
    'source_data.pan',
    'source_data.sub_type',
    'source_data.type',
    'success'
  ];
  const concatenated = orderedKeys
    .map((key) => {
      const value = key.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
      return value == null ? '' : String(value);
    })
    .join('');
  const computed = crypto
    .createHmac('sha512', process.env.PAYMOB_HMAC_SECRET || '')
    .update(concatenated)
    .digest('hex');
  return computed === receivedHmac;
}

module.exports = {
  isConfigured,
  startCardPayment,
  startWalletPayment,
  verifyWebhookHmac
};
