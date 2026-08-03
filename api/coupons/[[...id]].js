'use strict';

const { sendJson, readBody, methodNotAllowed } = require('../../lib/http');
const { requireAdmin } = require('../../lib/auth');
const { loadDb, saveDb } = require('../../lib/store');
const { normalizeCoupon, findValidCoupon, computeDiscount } = require('../../lib/catalog');

function getId(req) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const parts = url.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('coupons');
  const rest = idx !== -1 ? parts.slice(idx + 1) : [];
  return rest.length ? decodeURIComponent(rest[rest.length - 1]) : null;
}

// Public: check whether a coupon code is valid and how much it discounts.
async function handleValidate(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return methodNotAllowed(res, ['GET', 'POST']);

  let code;
  let subtotal;
  if (req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    code = url.searchParams.get('code');
    subtotal = Number(url.searchParams.get('subtotal')) || 0;
  } else {
    const body = await readBody(req);
    code = body.code;
    subtotal = Number(body.subtotal) || 0;
  }

  const db = await loadDb();
  const coupon = findValidCoupon(db.coupons, code);
  if (!coupon) return sendJson(res, 404, { valid: false, error: 'Invalid or expired coupon code' });

  const discount = computeDiscount(coupon, subtotal);
  return sendJson(res, 200, {
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount
  });
}

module.exports = async function handler(req, res) {
  const id = getId(req);

  if (id === 'validate') return handleValidate(req, res);

  if (!id) {
    if (req.method === 'GET') {
      const auth = await requireAdmin(req);
      if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });
      const db = await loadDb();
      return sendJson(res, 200, { coupons: db.coupons || [] });
    }

    if (req.method === 'POST') {
      const auth = await requireAdmin(req);
      if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

      const body = await readBody(req);
      const parsed = normalizeCoupon(body);
      if (parsed.error) return sendJson(res, 400, { error: parsed.error });

      const db = await loadDb();
      if (db.coupons.some((c) => c.code === parsed.coupon.code)) {
        return sendJson(res, 400, { error: 'A coupon with that code already exists' });
      }
      db.coupons.unshift(parsed.coupon);
      await saveDb(db);
      return sendJson(res, 201, { coupon: parsed.coupon });
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const auth = await requireAdmin(req);
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

    const db = await loadDb();
    const index = db.coupons.findIndex((c) => c.id === id);
    if (index === -1) return sendJson(res, 404, { error: 'Coupon not found' });

    const body = await readBody(req);
    const parsed = normalizeCoupon({ ...db.coupons[index], ...body }, db.coupons[index]);
    if (parsed.error) return sendJson(res, 400, { error: parsed.error });

    db.coupons[index] = parsed.coupon;
    await saveDb(db);
    return sendJson(res, 200, { coupon: parsed.coupon });
  }

  if (req.method === 'DELETE') {
    const auth = await requireAdmin(req);
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

    const db = await loadDb();
    const before = db.coupons.length;
    db.coupons = db.coupons.filter((c) => c.id !== id);
    if (db.coupons.length === before) return sendJson(res, 404, { error: 'Coupon not found' });
    await saveDb(db);
    return sendJson(res, 200, { ok: true });
  }

  return methodNotAllowed(res, ['PUT', 'PATCH', 'DELETE']);
};
