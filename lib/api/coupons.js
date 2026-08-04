'use strict';

const { sendJson, readBody, methodNotAllowed, getResourceId } = require('../http');
const { requireAdmin } = require('../auth');
const { loadDb, mutateDb } = require('../store');
const { normalizeCoupon, findValidCoupon, computeDiscount } = require('../catalog');

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

  const db = await loadDb({ fresh: true });
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
  const id = getResourceId(req, 'coupons');

  if (id === 'validate') return handleValidate(req, res);

  if (!id) {
    if (req.method === 'GET') {
      const auth = await requireAdmin(req);
      if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });
      const db = await loadDb({ fresh: true });
      return sendJson(res, 200, { coupons: db.coupons || [] });
    }

    if (req.method === 'POST') {
      const auth = await requireAdmin(req);
      if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

      const body = await readBody(req);
      const parsed = normalizeCoupon(body);
      if (parsed.error) return sendJson(res, 400, { error: parsed.error });

      try {
        const coupon = await mutateDb((db) => {
          if (db.coupons.some((c) => c.code === parsed.coupon.code)) {
            const err = new Error('A coupon with that code already exists');
            err.status = 400;
            throw err;
          }
          db.coupons.unshift(parsed.coupon);
          return parsed.coupon;
        });
        return sendJson(res, 201, { coupon });
      } catch (err) {
        return sendJson(res, err.status || 500, { error: err.message || 'Could not save coupon' });
      }
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const auth = await requireAdmin(req);
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

    const body = await readBody(req);
    try {
      const coupon = await mutateDb((db) => {
        const index = db.coupons.findIndex((c) => c.id === id);
        if (index === -1) {
          const err = new Error('Coupon not found');
          err.status = 404;
          throw err;
        }
        const parsed = normalizeCoupon({ ...db.coupons[index], ...body }, db.coupons[index]);
        if (parsed.error) {
          const err = new Error(parsed.error);
          err.status = 400;
          throw err;
        }
        db.coupons[index] = parsed.coupon;
        return parsed.coupon;
      });
      return sendJson(res, 200, { coupon });
    } catch (err) {
      return sendJson(res, err.status || 500, { error: err.message || 'Could not update coupon' });
    }
  }

  if (req.method === 'DELETE') {
    const auth = await requireAdmin(req);
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.error });

    try {
      await mutateDb((db) => {
        const before = db.coupons.length;
        db.coupons = db.coupons.filter((c) => c.id !== id);
        if (db.coupons.length === before) {
          const err = new Error('Coupon not found');
          err.status = 404;
          throw err;
        }
      });
      return sendJson(res, 200, { ok: true });
    } catch (err) {
      return sendJson(res, err.status || 500, { error: err.message || 'Could not delete coupon' });
    }
  }

  return methodNotAllowed(res, ['PUT', 'PATCH', 'DELETE']);
};
