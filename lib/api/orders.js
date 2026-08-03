'use strict';

const { sendJson, readBody, methodNotAllowed, getResourceId } = require('../http');
const { requireAdmin } = require('../auth');
const { loadDb, saveDb, uid } = require('../store');
const { applySales, findValidCoupon, computeDiscount } = require('../catalog');
const { getCustomerSession } = require('../customers');
const { sendOrderConfirmationEmail } = require('../email');

async function sendEmailWithTimeout(order, ms = 2500) {
  let timer;
  try {
    return await Promise.race([
      sendOrderConfirmationEmail({ to: order.shipping.email, order }),
      new Promise((resolve) => {
        timer = setTimeout(() => resolve({ ok: false, skipped: true, reason: 'timeout' }), ms);
      })
    ]);
  } catch {
    return { ok: false, skipped: false, reason: 'failed' };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

module.exports = async function handler(req, res) {
  const id = getResourceId(req, 'orders');

  if (!id) {
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

      let coupon = null;
      let discount = 0;
      if (body.couponCode) {
        coupon = findValidCoupon(db.coupons, body.couponCode);
        if (!coupon) return sendJson(res, 400, { error: 'Invalid or expired coupon code' });
        discount = computeDiscount(coupon, subtotal);
      }

      const total = Math.round((subtotal - discount + SHIPPING_FEE) * 100) / 100;
      const customerSession = getCustomerSession(req);

      const order = {
        id: uid('ord'),
        createdAt: new Date().toISOString(),
        status: paymentMethod === 'cod' ? 'awaiting_payment' : 'paid',
        paymentMethod,
        customerId: customerSession?.sub || null,
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
        couponCode: coupon ? coupon.code : null,
        discount,
        shippingFee: SHIPPING_FEE,
        total,
        cardLast4:
          paymentMethod === 'card' && body.cardLast4
            ? String(body.cardLast4).slice(-4)
            : null,
        note: String(body.note || '').trim()
      };

      db.orders.unshift(order);
      if (coupon) {
        const couponIndex = db.coupons.findIndex((c) => c.id === coupon.id);
        if (couponIndex !== -1) db.coupons[couponIndex].usedCount = (db.coupons[couponIndex].usedCount || 0) + 1;
      }
      await saveDb(db);

      // Don't let slow SMTP block / fail the order response (common on Vercel).
      let emailStatus = 'skipped';
      try {
        const mail = await sendEmailWithTimeout(order);
        emailStatus = mail.ok ? 'sent' : mail.skipped ? 'skipped' : 'failed';
      } catch {
        emailStatus = 'failed';
      }

      return sendJson(res, 201, { order, emailStatus });
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  }

  if (req.method === 'DELETE') {
    const auth = await requireAdmin(req);
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

    const db = await loadDb();
    const before = db.orders.length;
    db.orders = db.orders.filter((o) => o.id !== id);
    if (db.orders.length === before) return sendJson(res, 404, { error: 'Order not found' });
    await saveDb(db);
    return sendJson(res, 200, { ok: true });
  }

  return methodNotAllowed(res, ['DELETE']);
};
