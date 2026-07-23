'use strict';

const { sendJson, readBody, methodNotAllowed } = require('../../lib/http');
const { requireAdmin } = require('../../lib/auth');
const { loadDb, saveDb, uid } = require('../../lib/store');
const { applySales } = require('../../lib/catalog');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const auth = await requireAdmin(req);
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });
    const db = await loadDb();
    return sendJson(res, 200, { orders: db.orders || [] });
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return sendJson(res, 400, { error: 'Order has no items' });

    const shipping = body.shipping || {};
    if (!shipping.email || !shipping.firstName || !shipping.lastName || !shipping.address || !shipping.city) {
      return sendJson(res, 400, { error: 'Missing shipping details' });
    }

    const paymentMethod = String(body.paymentMethod || 'cod').toLowerCase();
    const allowed = ['cod', 'card', 'instapay'];
    if (!allowed.includes(paymentMethod)) {
      return sendJson(res, 400, { error: 'Invalid payment method' });
    }

    const db = await loadDb();
    const catalog = applySales(db.products || [], db.sales || []);
    const SHIPPING_FEE = 5;

    const lines = [];
    for (const item of items) {
      const product = catalog.find((p) => p.id === item.id);
      if (!product || product.active === false) {
        return sendJson(res, 400, { error: `Product unavailable: ${item.id}` });
      }
      const qty = Math.max(1, Number(item.qty) || 1);
      const unit = product.salePrice != null ? product.salePrice : product.price;
      lines.push({
        id: product.id,
        name: product.name,
        color: item.color || product.colors?.[0]?.name || '',
        size: item.size || product.size || product.sizes?.[0] || '',
        qty,
        unitPrice: unit,
        lineTotal: Math.round(unit * qty * 100) / 100,
        image: product.images?.[0] || ''
      });
    }

    const subtotal = Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
    const total = Math.round((subtotal + SHIPPING_FEE) * 100) / 100;

    const order = {
      id: uid('ord'),
      createdAt: new Date().toISOString(),
      status: paymentMethod === 'cod' ? 'awaiting_payment' : 'paid',
      paymentMethod,
      shipping: {
        email: String(shipping.email).trim(),
        phone: String(shipping.phone || '').trim(),
        firstName: String(shipping.firstName).trim(),
        lastName: String(shipping.lastName).trim(),
        country: String(shipping.country || '').trim(),
        region: String(shipping.region || '').trim(),
        address: String(shipping.address).trim(),
        city: String(shipping.city).trim(),
        postal: String(shipping.postal || '').trim()
      },
      items: lines,
      subtotal,
      shippingFee: SHIPPING_FEE,
      total,
      cardLast4:
        paymentMethod === 'card' && body.cardLast4
          ? String(body.cardLast4).slice(-4)
          : null,
      note: String(body.note || '').trim()
    };

    db.orders.unshift(order);
    await saveDb(db);
    return sendJson(res, 201, { order });
  }

  return methodNotAllowed(res, ['GET', 'POST']);
};
