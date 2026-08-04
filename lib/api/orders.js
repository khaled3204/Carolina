'use strict';

const { sendJson, readBody, methodNotAllowed, getResourceId } = require('../http');
const { requireAdmin } = require('../auth');
const { loadDb, mutateDb, uid } = require('../store');
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
      const db = await loadDb({ fresh: true });
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

      const customerSession = getCustomerSession(req);
      const SHIPPING_FEE = 5;

      let order;
      try {
        order = await mutateDb((db) => {
          const catalog = applySales(db.products || [], db.sales || []);
          const lines = [];
          for (const item of items) {
            const product = catalog.find((p) => p.id === item.id);
            if (!product || product.active === false) {
              const err = new Error(`Product unavailable: ${item.id}`);
              err.status = 400;
              throw err;
            }
            const qty = Math.max(1, Number(item.qty) || 1);
            const stock = Number.isFinite(Number(product.stock)) ? Number(product.stock) : 0;
            if (stock < qty) {
              const err = new Error(
                stock > 0
                  ? `Only ${stock} left in stock for ${product.name}`
                  : `${product.name} is out of stock`
              );
              err.status = 400;
              throw err;
            }
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
            if (!coupon) {
              const err = new Error('Invalid or expired coupon code');
              err.status = 400;
              throw err;
            }
            discount = computeDiscount(coupon, subtotal);
          }

          const total = Math.round((subtotal - discount + SHIPPING_FEE) * 100) / 100;
          const shippingEmail = String(shipping.email).trim().toLowerCase();

          // Link to signed-in customer, or any existing customer with this email.
          let customerId = customerSession?.sub || null;
          if (!customerId) {
            const match = (db.customers || []).find(
              (c) => String(c.email || '').toLowerCase() === shippingEmail
            );
            if (match) customerId = match.id;
          }

          const created = {
            id: uid('ord'),
            createdAt: new Date().toISOString(),
            status: paymentMethod === 'cod' ? 'awaiting_payment' : 'paid',
            paymentMethod,
            customerId,
            shipping: {
              email: shippingEmail,
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

          db.orders.unshift(created);
          if (coupon) {
            const couponIndex = db.coupons.findIndex((c) => c.id === coupon.id);
            if (couponIndex !== -1) {
              db.coupons[couponIndex].usedCount = (db.coupons[couponIndex].usedCount || 0) + 1;
            }
          }
          for (const line of lines) {
            const productIndex = db.products.findIndex((p) => p.id === line.id);
            if (productIndex !== -1) {
              const current = Number.isFinite(Number(db.products[productIndex].stock))
                ? Number(db.products[productIndex].stock)
                : 0;
              db.products[productIndex].stock = Math.max(0, current - line.qty);
            }
          }
          return created;
        });
      } catch (err) {
        return sendJson(res, err.status || 500, { error: err.message || 'Could not place order' });
      }

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

    try {
      await mutateDb((db) => {
        const before = db.orders.length;
        db.orders = db.orders.filter((o) => o.id !== id);
        if (db.orders.length === before) {
          const err = new Error('Order not found');
          err.status = 404;
          throw err;
        }
      });
      return sendJson(res, 200, { ok: true });
    } catch (err) {
      return sendJson(res, err.status || 500, { error: err.message || 'Could not delete order' });
    }
  }

  return methodNotAllowed(res, ['DELETE']);
};
