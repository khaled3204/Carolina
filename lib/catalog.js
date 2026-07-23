'use strict';

const { uid, slugify } = require('./store');

function normalizeProduct(input, existing = null) {
  const name = String(input.name || '').trim();
  if (!name) return { error: 'Name is required' };

  const price = Number(input.price);
  if (!Number.isFinite(price) || price < 0) return { error: 'Valid price is required' };

  let colors = input.colors;
  if (typeof colors === 'string') {
    try {
      colors = JSON.parse(colors);
    } catch {
      colors = colors.split(',').map((c) => ({ name: c.trim().toUpperCase(), hex: '#cccccc' }));
    }
  }
  if (!Array.isArray(colors) || !colors.length) {
    colors = [{ name: 'BLACK', hex: '#111111' }];
  }
  colors = colors
    .map((c) => ({
      name: String(c.name || c.label || 'COLOR').trim().toUpperCase(),
      hex: String(c.hex || '#cccccc').trim()
    }))
    .filter((c) => c.name);

  let sizes = input.sizes;
  if (typeof sizes === 'string') {
    sizes = sizes.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (!Array.isArray(sizes) || !sizes.length) {
    sizes = [String(input.size || 'FREE SIZE').trim() || 'FREE SIZE'];
  }

  let images = input.images;
  if (typeof images === 'string') {
    images = images.split('\n').map((s) => s.trim()).filter(Boolean);
  }
  if (!Array.isArray(images) || !images.length) {
    images = existing?.images || ['images/products/sheer-nude-flat.png'];
  }

  const id = existing?.id || slugify(input.id || name) || uid('sock');

  return {
    product: {
      id,
      name,
      price,
      images,
      colors,
      sizes,
      size: sizes[0],
      description: String(input.description || '').trim(),
      stock: Number.isFinite(Number(input.stock)) ? Number(input.stock) : existing?.stock ?? 0,
      active: input.active === false || input.active === 'false' ? false : true,
      saleId: input.saleId || existing?.saleId || null,
      updatedAt: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString()
    }
  };
}

function applySales(products, sales) {
  const now = Date.now();
  const activeSales = (sales || []).filter((s) => {
    if (!s.active) return false;
    const start = s.startsAt ? Date.parse(s.startsAt) : 0;
    const end = s.endsAt ? Date.parse(s.endsAt) : Infinity;
    return now >= start && now <= end;
  });

  return products.map((p) => {
    const sale =
      activeSales.find((s) => s.id === p.saleId) ||
      activeSales.find((s) => (s.productIds || []).includes(p.id)) ||
      activeSales.find((s) => !s.productIds?.length);

    if (!sale) return { ...p, salePrice: null, discountPercent: null };

    const pct = Number(sale.discountPercent) || 0;
    const salePrice = Math.max(0, Math.round(p.price * (1 - pct / 100) * 100) / 100);
    return {
      ...p,
      salePrice,
      discountPercent: pct,
      saleLabel: sale.name || null
    };
  });
}

function normalizeSale(input, existing = null) {
  const name = String(input.name || '').trim();
  if (!name) return { error: 'Sale name is required' };

  const discountPercent = Number(input.discountPercent);
  if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 90) {
    return { error: 'Discount must be between 1 and 90 percent' };
  }

  let productIds = input.productIds;
  if (typeof productIds === 'string') {
    productIds = productIds.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (!Array.isArray(productIds)) productIds = [];

  return {
    sale: {
      id: existing?.id || uid('sale'),
      name,
      discountPercent,
      productIds,
      active: input.active === false || input.active === 'false' ? false : true,
      startsAt: input.startsAt || existing?.startsAt || new Date().toISOString(),
      endsAt: input.endsAt || existing?.endsAt || null,
      createdAt: existing?.createdAt || new Date().toISOString()
    }
  };
}

module.exports = { normalizeProduct, applySales, normalizeSale };
