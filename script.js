/* ==========================================================================
   CAROLINA — shared behaviors + product catalog / cart / payment
   ========================================================================== */

const CART_KEY = 'carolina-cart';
const CHECKOUT_KEY = 'carolina-checkout';
const COUPON_KEY = 'carolina-coupon';
const SHIPPING_RATE = 0.14; // shipping fee = 14% of subtotal (EGP)
const shippingFor = (subtotal) => Math.round(Number(subtotal || 0) * SHIPPING_RATE * 100) / 100;

const t = (key, vars) =>
  (window.CarolinaI18n && typeof window.CarolinaI18n.t === 'function'
    ? window.CarolinaI18n.t(key, vars)
    : key);

const DEFAULT_PRODUCTS = [
  {
    id: 'sheer-polka-black',
    name: 'Sheer Ankle Socks — Polka Dot',
    price: 199,
    images: [
      'images/products/sheer-polka-black.png',
      'images/products/sock-detail-2.jpg'
    ],
    colors: [
      { name: 'BLACK', hex: '#111111' },
      { name: 'NUDE', hex: '#C4A484' },
      { name: 'WHITE', hex: '#ffffff' }
    ],
    size: 'FREE SIZE',
    sizes: ['FREE SIZE'],
    description:
      'Women\'s sheer ankle socks in a classic black polka-dot mesh. Lightweight nylon with a soft elastic cuff, reinforced heel and toe for everyday elegance with flats, loafers, or heels.'
  },
  {
    id: 'sheer-floral-white',
    name: 'Sheer Crew Socks — Floral',
    price: 189,
    images: [
      'images/products/sheer-floral-white.png',
      'images/products/sock-detail-3.jpg'
    ],
    colors: [
      { name: 'WHITE', hex: '#ffffff' },
      { name: 'CREAM', hex: '#F5F0E6' },
      { name: 'BLACK', hex: '#111111' }
    ],
    size: 'FREE SIZE',
    sizes: ['FREE SIZE'],
    description:
      'Delicate sheer crew socks with a soft floral motif. Breathable mesh body, opaque cuff, heel, and toe — refined enough for formal looks, comfortable enough for all day.'
  },
  {
    id: 'sheer-star-cream',
    name: 'Sheer Crew Socks — Star',
    price: 189,
    images: [
      'images/products/sheer-star-cream.png',
      'images/products/sock-detail-4.jpg'
    ],
    colors: [
      { name: 'CREAM', hex: '#F5F0E6' },
      { name: 'WHITE', hex: '#ffffff' },
      { name: 'NUDE', hex: '#C4A484' }
    ],
    size: 'FREE SIZE',
    sizes: ['FREE SIZE'],
    description:
      'Sheer cream crew socks patterned with crisp white stars. Ultra-thin nylon with a secure ribbed cuff and reinforced finish for a polished, barely-there feel.'
  },
  {
    id: 'sheer-nude-flat',
    name: 'Sheer Nude Ankle Socks',
    price: 149,
    images: [
      'images/products/sheer-nude-flat.png',
      'images/products/sheer-nude-worn.jpg'
    ],
    colors: [
      { name: 'NUDE', hex: '#C4A484' },
      { name: 'BEIGE', hex: '#D2B48C' },
      { name: 'BLACK', hex: '#111111' }
    ],
    size: 'FREE SIZE',
    sizes: ['FREE SIZE'],
    description:
      'Essential sheer nude ankle socks designed for a smooth, barely-there look. Soft elastic cuff, reinforced heel and toe — perfect under loafers, flats, and formal shoes.'
  },
  {
    id: 'overknee-mosaic',
    name: 'Over-Knee Socks — Mosaic',
    price: 249,
    images: [
      'images/products/overknee-mosaic.png',
      'images/products/overknee-mosaic-flat.jpeg'
    ],
    colors: [
      { name: 'WHITE', hex: '#ffffff' },
      { name: 'GRAY', hex: '#9A9A9A' }
    ],
    size: 'FREE SIZE',
    sizes: ['FREE SIZE'],
    description:
      'Statement over-knee socks in a soft white mosaic knit. Stretch comfort from cuff to toe with a modern geometric texture that elevates casual and dress looks alike.'
  },
  {
    id: 'ankle-beige-pack',
    name: 'Mesh Ankle Socks — Beige Pack',
    price: 129,
    images: [
      'images/products/ankle-beige-pack.jpg',
      'images/products/sock-detail-5.jpg'
    ],
    colors: [
      { name: 'BEIGE', hex: '#D2B48C' },
      { name: 'NUDE', hex: '#C4A484' }
    ],
    size: 'FREE SIZE',
    sizes: ['FREE SIZE'],
    description:
      'Breathable beige mesh ankle socks with reinforced toe and heel. A versatile everyday staple with a slim profile that disappears under sneakers and loafers.'
  },
  {
    id: 'sheer-nude-worn',
    name: 'Sheer Nude Socks — Everyday',
    price: 139,
    images: [
      'images/products/sheer-nude-worn.jpg',
      'images/products/sheer-nude-flat.png'
    ],
    colors: [
      { name: 'NUDE', hex: '#C4A484' },
      { name: 'TAN', hex: '#D2B48C' },
      { name: 'WHITE', hex: '#ffffff' }
    ],
    size: 'FREE SIZE',
    sizes: ['FREE SIZE'],
    description:
      'Fine sheer nude socks for everyday wear. Lightweight, breathable, and shaped for a natural skin-tone finish with a comfortable elastic cuff.'
  },
  {
    id: 'sheer-detail-set',
    name: 'Sheer Detail Ankle Socks',
    price: 159,
    images: [
      'images/products/sock-detail-3.jpg',
      'images/products/sock-detail-2.jpg'
    ],
    colors: [
      { name: 'BLACK', hex: '#111111' },
      { name: 'NUDE', hex: '#C4A484' },
      { name: 'OLIVE', hex: '#8A8F3A' }
    ],
    size: 'FREE SIZE',
    sizes: ['FREE SIZE'],
    description:
      'Refined sheer ankle socks with a clean silhouette and soft stretch. Designed for all-day comfort and an elegant finish with any shoe.'
  }
];

let PRODUCTS = [...DEFAULT_PRODUCTS];

/* ---- Helpers ---- */
const currencyLabel = () =>
  window.CarolinaI18n && typeof window.CarolinaI18n.getLang === 'function' && window.CarolinaI18n.getLang() === 'ar'
    ? 'ج.م'
    : 'EGP';
const money = (n) =>
  `${Number(n).toFixed(Number.isInteger(n) ? 0 : 2).replace(/\.00$/, '')} ${currencyLabel()}`;
const moneyFixed = (n) => `${Number(n).toFixed(2)} ${currencyLabel()}`;

const unitPrice = (product) =>
  product && product.salePrice != null ? Number(product.salePrice) : Number(product?.price || 0);

const getProduct = (id) => PRODUCTS.find((p) => p.id === id) || PRODUCTS[0] || DEFAULT_PRODUCTS[0];

const readCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCart = (items) => {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartBadge();
};

const readCheckout = () => {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCheckout = (data) => {
  sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(data));
};

const clearCheckout = () => sessionStorage.removeItem(CHECKOUT_KEY);

const readCoupon = () => {
  try {
    const raw = sessionStorage.getItem(COUPON_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCoupon = (coupon) => sessionStorage.setItem(COUPON_KEY, JSON.stringify(coupon));
const clearCoupon = () => sessionStorage.removeItem(COUPON_KEY);

// Re-checks a coupon code against the current subtotal (discount can depend on it).
async function validateCoupon(code, subtotal) {
  if (!code) return { valid: false, error: t('coupon.enter') };
  try {
    const res = await fetch(
      `/api/coupons/validate?code=${encodeURIComponent(code)}&subtotal=${encodeURIComponent(subtotal)}`
    );
    const data = await res.json();
    if (!res.ok || !data.valid) return { valid: false, error: data.error || t('coupon.invalid') };
    return data;
  } catch {
    return { valid: false, error: t('coupon.checkFail') };
  }
}

const cartQtyTotal = (items = readCart()) =>
  items.reduce((sum, item) => sum + (item.qty || 0), 0);

const cartSubtotal = (items = readCart()) =>
  items.reduce((sum, item) => {
    const product = getProduct(item.id);
    return sum + unitPrice(product) * (item.qty || 0);
  }, 0);

const showToast = (message) => {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
};

const updateCartBadge = () => {
  const count = cartQtyTotal();
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    el.textContent = String(count);
    el.hidden = count === 0;
  });
};

const addToCart = (id, color, qty = 1, size = null) => {
  const product = getProduct(id);
  const chosenSize = size || product.size || product.sizes?.[0] || 'FREE SIZE';
  const items = readCart();
  const existing = items.find(
    (item) => item.id === id && item.color === color && item.size === chosenSize
  );
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({ id, color, size: chosenSize, qty });
  }
  writeCart(items);
  showToast(t('toast.added'));
};

async function loadCatalog() {
  try {
    const res = await fetch('/api/products', { cache: 'no-store' });
    if (!res.ok) throw new Error('catalog unavailable');
    const data = await res.json();
    if (Array.isArray(data.products) && data.products.length) {
      PRODUCTS = data.products.map((p) => ({
        ...p,
        size: p.size || p.sizes?.[0] || 'FREE SIZE',
        sizes: p.sizes?.length ? p.sizes : [p.size || 'FREE SIZE']
      }));
    }
  } catch {
    PRODUCTS = [...DEFAULT_PRODUCTS];
  }
}

/* ---- Mobile nav ---- */
const initMobileNav = () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (!menuToggle || !mobileNav) return;

  menuToggle.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? t('nav.closeMenu') : t('nav.openMenu'));
  });
};

/* ---- Hero carousel ---- */
const initHero = () => {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  if (slides.length < 2) return;

  let current = 0;
  let timer;

  const show = (i) => {
    slides.forEach((s, idx) => s.classList.toggle('is-active', idx === i));
    dots.forEach((d, idx) => {
      d.classList.toggle('is-active', idx === i);
      d.setAttribute('aria-selected', idx === i ? 'true' : 'false');
    });
    current = i;
  };

  const next = () => show((current + 1) % slides.length);
  const prev = () => show((current - 1 + slides.length) % slides.length);

  const restart = () => {
    clearInterval(timer);
    timer = setInterval(next, 5000);
  };

  document.querySelector('.hero-arrow.prev')?.addEventListener('click', () => {
    prev();
    restart();
  });
  document.querySelector('.hero-arrow.next')?.addEventListener('click', () => {
    next();
    restart();
  });
  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      show(idx);
      restart();
    });
  });

  show(0);
  restart();
};

/* ---- Collections grid ---- */
const initCollections = () => {
  const grid = document.querySelector('[data-collections-grid]');
  if (!grid) return;

  grid.innerHTML = PRODUCTS.map((product) => {
    const priceHtml =
      product.salePrice != null
        ? `<span class="product-price"><s style="opacity:.55;margin-right:6px">${money(product.price)}</s>${money(product.salePrice)}</span>`
        : `<span class="product-price">${money(product.price)}</span>`;
    const stockHtml = stockBadge(product.stock);
    return `
    <a class="product-card ${product.stock === 0 ? 'is-out-of-stock' : ''}" href="product.html?item=${encodeURIComponent(product.id)}">
      <div class="product-media">
        <img src="${product.images[0]}" alt="${product.name}" loading="lazy" />
        ${stockHtml}
      </div>
      <div class="product-info">
        <span class="product-name">${product.name}</span>
        ${priceHtml}
      </div>
    </a>`;
  }).join('');
};

/* ---- Stock helper (used on collections + product page) ---- */
function stockBadge(stock) {
  const n = Number(stock);
  if (!Number.isFinite(n)) return '';
  if (n <= 0) return `<span class="stock-pill out">${t('stock.out')}</span>`;
  if (n <= 5) return `<span class="stock-pill low">${t('stock.low', { n })}</span>`;
  return `<span class="stock-pill in">${t('stock.in')}</span>`;
}

/* ---- Product detail ---- */
const initProductDetail = () => {
  const root = document.querySelector('[data-product-detail]');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const product = getProduct(params.get('item'));
  let selectedColor = product.colors[0].name;
  const sizes = product.sizes?.length ? product.sizes : [product.size || 'FREE SIZE'];
  let selectedSize = sizes[0];

  document.title = `${product.name} — Carolina`;

  // Some colors have their own photo set (e.g. a black sock vs a tan sock look
  // very different) — fall back to the shared gallery when a color has none.
  const imagesForColor = (colorName) => {
    const c = product.colors.find((x) => x.name === colorName);
    return c && Array.isArray(c.images) && c.images.length ? c.images : product.images;
  };

  const render = () => {
    const priceBlock =
      product.salePrice != null
        ? `<p class="detail-price"><s style="opacity:.5;margin-right:10px;font-size:0.75em">${money(product.price)}</s>${money(product.salePrice)}${product.discountPercent ? ` <span style="font-size:12px;color:var(--gold-dark)">−${product.discountPercent}%</span>` : ''}</p>`
        : `<p class="detail-price">${money(product.price)}</p>`;

    const displayImages = imagesForColor(selectedColor);

    root.innerHTML = `
      <h1>${product.name}</h1>
      <div class="thumb-col">
        ${displayImages
        .map(
          (src, i) => `
          <button type="button" data-thumb class="${i === 0 ? 'active' : ''}" data-full="${src}" aria-label="${t('product.viewImage', { n: i + 1 })}">
            <img src="${src}" alt="" />
          </button>`
        )
        .join('')}
      </div>
      <div class="main-image">
        <img data-main-image src="${displayImages[0]}" alt="${product.name}" />
      </div>
      <div class="detail-info">
        ${priceBlock}
        <p class="detail-label">COLOR : <span data-color-label>${selectedColor}</span></p>
        <div class="swatches">
          ${product.colors
        .map(
          (c) => `
            <button type="button" class="swatch ${c.name === selectedColor ? 'selected' : ''}"
              style="background:${c.hex}${c.hex.toLowerCase() === '#ffffff' ? ';border:1px solid #ddd' : ''}"
              data-color="${c.name}" aria-label="${c.name}"></button>`
        )
        .join('')}
        </div>
        <p class="detail-label">SIZE : <span data-size-label>${selectedSize}</span></p>
        ${sizes.length > 1
        ? `<div class="swatches" style="gap:8px">${sizes
          .map(
            (s) =>
              `<button type="button" class="btn-gold" style="padding:8px 14px;font-size:12px;background:${s === selectedSize ? 'var(--gold)' : 'var(--cream)'}" data-size="${s}">${s}</button>`
          )
          .join('')}</div>`
        : ''
      }
        <p class="detail-stock">${stockBadge(product.stock)}</p>
        <hr class="divider" />
        <h2>Description</h2>
        <p>${product.description || ''}</p>
        <button class="btn-gold full" type="button" data-add-to-cart ${product.stock === 0 ? 'disabled' : ''}>${product.stock === 0 ? 'Out of stock' : 'Add To Cart'}</button>
      </div>
      <div class="related-products" data-related-products></div>`;

    root.querySelectorAll('[data-thumb]').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        root.querySelectorAll('[data-thumb]').forEach((t) => t.classList.remove('active'));
        thumb.classList.add('active');
        const mainImg = root.querySelector('[data-main-image]');
        if (mainImg && thumb.dataset.full) mainImg.src = thumb.dataset.full;
        setupMagnifier();
      });
    });

    root.querySelectorAll('.swatch[data-color]').forEach((swatch) => {
      swatch.addEventListener('click', () => {
        selectedColor = swatch.dataset.color;
        // Colors can carry their own photo set, so re-render the whole
        // gallery (thumbnails + main image) rather than just the label.
        render();
      });
    });

    root.querySelectorAll('[data-size]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedSize = btn.dataset.size;
        const label = root.querySelector('[data-size-label]');
        if (label) label.textContent = selectedSize;
        render();
      });
    });

    root.querySelector('[data-add-to-cart]')?.addEventListener('click', () => {
      if (product.stock === 0) return;
      addToCart(product.id, selectedColor, 1, selectedSize);
      renderRelated(); // refresh "also added" suggestions after a cart change
    });

    renderRelated();
    setupMagnifier();
  };

  // Hover magnifier: a small round lens follows the cursor over the main
  // product photo, showing a zoomed-in view inside it.
  const setupMagnifier = () => {
    const container = root.querySelector('.main-image');
    const imgEl = root.querySelector('[data-main-image]');
    if (!container || !imgEl) return;
    const zoom = 2.4;

    let lens = container.querySelector('.img-magnifier-lens');
    if (!lens) {
      lens = document.createElement('div');
      lens.className = 'img-magnifier-lens';
      container.appendChild(lens);
    }

    const updateBackground = () => {
      lens.style.backgroundImage = `url('${imgEl.currentSrc || imgEl.src}')`;
      const w = imgEl.clientWidth || container.clientWidth;
      const h = imgEl.clientHeight || container.clientHeight;
      lens.style.backgroundSize = `${w * zoom}px ${h * zoom}px`;
    };

    const moveLens = (e) => {
      const rect = imgEl.getBoundingClientRect();
      const point = e.touches ? e.touches[0] : e;
      let x = point.clientX - rect.left;
      let y = point.clientY - rect.top;
      const half = lens.offsetWidth / 2;
      x = Math.max(half, Math.min(x, rect.width - half));
      y = Math.max(half, Math.min(y, rect.height - half));
      lens.style.left = `${x - half}px`;
      lens.style.top = `${y - half}px`;
      lens.style.backgroundPosition = `-${x * zoom - half}px -${y * zoom - half}px`;
    };

    imgEl.onload = updateBackground;
    if (imgEl.complete) updateBackground();

    container.onmouseenter = () => {
      updateBackground();
      lens.style.opacity = '1';
    };
    container.onmousemove = moveLens;
    container.onmouseleave = () => {
      lens.style.opacity = '0';
    };
  };

  // Lightweight "customers also like" suggestions — picks other in-stock
  // products, preferring similar price range to the current item.
  const renderRelated = () => {
    const relatedRoot = root.querySelector('[data-related-products]');
    if (!relatedRoot) return;

    const others = PRODUCTS.filter((p) => p.id !== product.id && p.active !== false);
    const scored = others
      .map((p) => ({ p, score: Math.abs(unitPrice(p) - unitPrice(product)) }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 4)
      .map((s) => s.p);

    if (!scored.length) {
      relatedRoot.innerHTML = '';
      return;
    }

    relatedRoot.innerHTML = `
      <h2>${t('product.related')}</h2>
      <div class="related-grid">
        ${scored
          .map(
            (p) => `
          <a class="product-card" href="product.html?item=${encodeURIComponent(p.id)}">
            <div class="product-media">
              <img src="${p.images[0]}" alt="${p.name}" loading="lazy" />
            </div>
            <div class="product-info">
              <span class="product-name">${p.name}</span>
              <span class="product-price">${money(unitPrice(p))}</span>
            </div>
          </a>`
          )
          .join('')}
      </div>`;
  };

  render();
};

/* ---- Cart page ---- */
const initCartPage = () => {
  const root = document.querySelector('[data-cart-page]');
  if (!root) return;

  const render = () => {
    const items = readCart();

    if (!items.length) {
      root.innerHTML = `
        <div class="cart-empty">
          <p>${t('cart.empty')}</p>
          <a href="collections.html" class="btn-gold">${t('home.shop')}</a>
        </div>`;
      return;
    }

    const subtotal = cartSubtotal(items);
    const coupon = readCoupon();
    const discount = coupon ? coupon.discount : 0;
    const total = Math.max(0, subtotal - discount) + shippingFor(subtotal);

    root.innerHTML = `
      <div class="cart-items">
        ${items
        .map((item, index) => {
          const product = getProduct(item.id);
          const line = unitPrice(product) * item.qty;
          const size = item.size || product.size || t('product.freeSize');
          return `
            <div class="cart-row" data-index="${index}">
              <img src="${product.images[0]}" alt="${product.name}" />
              <div>
                <p class="cart-item-name">${product.name}</p>
                <p class="cart-item-variant">${item.color} / ${size}</p>
                <p class="cart-item-price">${money(unitPrice(product))}</p>
                <button type="button" class="cart-remove" data-remove>${t('cart.remove')}</button>
              </div>
              <div class="qty-control">
                <button type="button" data-qty-dec aria-label="${t('cart.decQty')}">–</button>
                <span data-qty>${item.qty}</span>
                <button type="button" data-qty-inc aria-label="${t('cart.incQty')}">+</button>
              </div>
              <div class="line-total">${money(line)}</div>
            </div>`;
        })
        .join('')}
      </div>
      <div class="summary-box">
        <div class="coupon-box">
          <input type="text" data-coupon-input placeholder="${t('cart.couponPlaceholder')}" value="${coupon ? coupon.code : ''}" />
          <button type="button" data-coupon-apply class="btn-gold" style="padding:10px 18px;font-size:12px">${coupon ? t('cart.update') : t('cart.apply')}</button>
          ${coupon ? `<button type="button" data-coupon-remove class="cart-remove">${t('cart.remove')}</button>` : ''}
        </div>
        <p class="coupon-message" data-coupon-message></p>
        <div class="summary-row"><span>${t('cart.subtotal')}</span><span>${moneyFixed(subtotal)}</span></div>
        ${coupon ? `<div class="summary-row"><span>${t('cart.discount')} (${coupon.code})</span><span>-${moneyFixed(discount)}</span></div>` : ''}
        <div class="summary-row"><span>${t('cart.shipping')}</span><span>${moneyFixed(shippingFor(subtotal))}</span></div>
        <div class="summary-row total"><span>${t('cart.total')}</span><span>${moneyFixed(total)}</span></div>
        <a href="checkout.html" class="btn-gold">
          ${t('cart.checkout')}
          <svg viewBox="0 0 24 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M0 6h22M17 1l5 5-5 5" />
          </svg>
        </a>
      </div>`;

    root.querySelector('[data-coupon-apply]')?.addEventListener('click', async () => {
      const input = root.querySelector('[data-coupon-input]');
      const msg = root.querySelector('[data-coupon-message]');
      const code = String(input.value || '').trim();
      msg.textContent = t('cart.checking');
      const result = await validateCoupon(code, cartSubtotal(items));
      if (!result.valid) {
        clearCoupon();
        msg.textContent = result.error || t('coupon.invalid');
        return;
      }
      writeCoupon(result);
      render();
    });

    root.querySelector('[data-coupon-remove]')?.addEventListener('click', () => {
      clearCoupon();
      render();
    });

    root.querySelectorAll('.cart-row').forEach((row) => {
      const index = Number(row.dataset.index);
      row.querySelector('[data-qty-dec]')?.addEventListener('click', async () => {
        const cart = readCart();
        if (cart[index].qty > 1) cart[index].qty -= 1;
        writeCart(cart);
        await refreshCouponForCart(cart);
        render();
      });
      row.querySelector('[data-qty-inc]')?.addEventListener('click', async () => {
        const cart = readCart();
        cart[index].qty += 1;
        writeCart(cart);
        await refreshCouponForCart(cart);
        render();
      });
      row.querySelector('[data-remove]')?.addEventListener('click', async () => {
        const cart = readCart();
        cart.splice(index, 1);
        writeCart(cart);
        await refreshCouponForCart(cart);
        render();
      });
    });
  };

  render();
};

// Keeps an applied coupon's discount amount in sync with the current subtotal.
async function refreshCouponForCart(items) {
  const coupon = readCoupon();
  if (!coupon) return;
  if (!items.length) {
    clearCoupon();
    return;
  }
  const result = await validateCoupon(coupon.code, cartSubtotal(items));
  if (result.valid) writeCoupon(result);
  else clearCoupon();
}

/* ---- Checkout page ---- */
const initCheckoutPage = () => {
  const root = document.querySelector('[data-checkout-page]');
  if (!root) return;

  // If the shopper is signed in, prefill the email so the order links up
  // with their account automatically (order history matches by email).
  let signedInEmail = '';

  const render = () => {
    const items = readCart();

    if (!items.length) {
      root.innerHTML = `
        <div class="checkout-empty">
          <p>${t('cart.empty')}</p>
          <a href="collections.html" class="btn-gold">${t('home.shop')}</a>
        </div>`;
      return;
    }

    const subtotal = cartSubtotal(items);
    const coupon = readCoupon();
    const discount = coupon ? coupon.discount : 0;
    const total = Math.max(0, subtotal - discount) + shippingFor(subtotal);
    const count = cartQtyTotal(items);
    const saved = readCheckout()?.shipping || {};

    root.innerHTML = `
      <div>
        <h1>${t('checkout.title')}</h1>
        <form data-checkout-form>
          <p class="form-section-label">${t('checkout.contact')}</p>
          <div class="form-grid single">
            <input type="email" name="email" placeholder="${t('checkout.email')}" autocomplete="email" value="${saved.email || signedInEmail || ''}" required />
            <input type="tel" name="phone" placeholder="${t('checkout.phone')}" autocomplete="tel" value="${saved.phone || ''}" />
          </div>

          <p class="form-section-label">${t('checkout.shipping')}</p>
          <div class="form-grid">
            <input type="text" name="firstName" placeholder="${t('checkout.firstName')}" autocomplete="given-name" value="${saved.firstName || ''}" required />
            <input type="text" name="lastName" placeholder="${t('checkout.lastName')}" autocomplete="family-name" value="${saved.lastName || ''}" required />
            <input class="span-2" type="text" name="country" placeholder="${t('checkout.country')}" autocomplete="country-name" value="${saved.country || 'Egypt'}" required />
            <input class="span-2" type="text" name="region" placeholder="${t('checkout.region')}" autocomplete="address-level1" value="${saved.region || ''}" />
            <input class="span-2" type="text" name="address" placeholder="${t('checkout.address')}" autocomplete="street-address" value="${saved.address || ''}" required />
            <input type="text" name="city" placeholder="${t('checkout.city')}" autocomplete="address-level2" value="${saved.city || ''}" required />
            <input type="text" name="postal" placeholder="${t('checkout.postal')}" autocomplete="postal-code" value="${saved.postal || ''}" required />
          </div>

          <button type="submit" class="payment-btn">
            ${t('checkout.continue')}
            <svg viewBox="0 0 24 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M0 6h22M17 1l5 5-5 5" />
            </svg>
          </button>
        </form>
      </div>

      <aside class="order-summary">
        <div class="order-summary-top">
          <span>${t('checkout.yourOrder')}</span>
          <span class="count">(${count})</span>
        </div>
        ${items
        .map((item, index) => {
          const product = getProduct(item.id);
          const size = item.size || product.size || t('product.freeSize');
          return `
            <div class="order-row" data-index="${index}">
              <img src="${product.images[0]}" alt="${product.name}" />
              <div>
                <p class="order-row-name">
                  ${product.name}
                  <button type="button" data-remove>${t('checkout.remove')}</button>
                </p>
                <p class="order-row-variant">${item.color} / ${size}</p>
                <div class="order-row-bottom"><span>(${item.qty})</span><span>${money(unitPrice(product) * item.qty)}</span></div>
              </div>
            </div>`;
        })
        .join('')}
        <div class="summary-row"><span>${t('cart.subtotal')}</span><span>${moneyFixed(subtotal)}</span></div>
        ${coupon ? `<div class="summary-row"><span>${t('cart.discount')} (${coupon.code})</span><span>-${moneyFixed(discount)}</span></div>` : ''}
        <div class="summary-row"><span>${t('cart.shipping')}</span><span>${moneyFixed(shippingFor(subtotal))}</span></div>
        <div class="summary-row total"><span>${t('cart.total')}</span><span>${moneyFixed(total)}</span></div>
      </aside>`;

    root.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('[data-index]');
        const index = Number(row?.dataset.index);
        const cart = readCart();
        cart.splice(index, 1);
        writeCart(cart);
        render();
      });
    });

    root.querySelector('[data-checkout-form]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      writeCheckout({
        shipping: {
          email: String(fd.get('email') || '').trim(),
          phone: String(fd.get('phone') || '').trim(),
          firstName: String(fd.get('firstName') || '').trim(),
          lastName: String(fd.get('lastName') || '').trim(),
          country: String(fd.get('country') || '').trim(),
          region: String(fd.get('region') || '').trim(),
          address: String(fd.get('address') || '').trim(),
          city: String(fd.get('city') || '').trim(),
          postal: String(fd.get('postal') || '').trim()
        }
      });
      window.location.href = 'payment.html';
    });
  };

  render();

  fetch('/api/account/me', { credentials: 'same-origin' })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data?.customer?.email) {
        signedInEmail = data.customer.email;
        // Only re-render if the shopper hasn't already typed/saved a different email.
        if (!readCheckout()?.shipping?.email) render();
      }
    })
    .catch(() => {
      /* not signed in / offline — leave the field blank */
    });
};

/* ---- Payment page ---- */
const luhnOk = (num) => {
  const digits = String(num).replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
};

const initPaymentPage = () => {
  const root = document.querySelector('[data-payment-page]');
  if (!root) return;

  const checkout = readCheckout();
  const items = readCart();

  if (!items.length) {
    root.innerHTML = `
      <div class="payment-empty">
        <p>${t('payment.emptyCart')}</p>
        <a href="collections.html" class="btn-gold">${t('home.shop')}</a>
      </div>`;
    return;
  }

  if (!checkout?.shipping) {
    root.innerHTML = `
      <div class="payment-empty">
        <p>${t('payment.needShipping')}</p>
        <a href="checkout.html" class="btn-gold">${t('payment.backCheckout')}</a>
      </div>`;
    return;
  }

  let method = 'cod';
  const ship = checkout.shipping;
  const subtotal = cartSubtotal(items);
  const coupon = readCoupon();
  const discount = coupon ? coupon.discount : 0;
  const total = Math.max(0, subtotal - discount) + shippingFor(subtotal);
  const count = cartQtyTotal(items);

  const render = () => {
    root.innerHTML = `
      <div>
        <h1>${t('payment.title')}</h1>
        <p class="payment-lead">${t('payment.lead')}</p>

        <div class="pay-methods" role="radiogroup" aria-label="${t('payment.methods')}">
          <label class="pay-option ${method === 'cod' ? 'is-selected' : ''}">
            <input type="radio" name="pay" value="cod" ${method === 'cod' ? 'checked' : ''} />
            <div>
              <p class="pay-option-title">${t('payment.cod')}</p>
              <p class="pay-option-desc">${t('payment.codDesc')}</p>
            </div>
            <span class="pay-badge">${t('payment.popular')}</span>
          </label>
          <label class="pay-option ${method === 'card' ? 'is-selected' : ''}">
            <input type="radio" name="pay" value="card" ${method === 'card' ? 'checked' : ''} />
            <div>
              <p class="pay-option-title">${t('payment.card')}</p>
              <p class="pay-option-desc">${t('payment.cardDesc')}</p>
            </div>
          </label>
          <label class="pay-option ${method === 'instapay' ? 'is-selected' : ''}">
            <input type="radio" name="pay" value="instapay" ${method === 'instapay' ? 'checked' : ''} />
            <div>
              <p class="pay-option-title">${t('payment.instapay')}</p>
              <p class="pay-option-desc">${t('payment.instapayDesc')}</p>
            </div>
          </label>
        </div>

        <div class="card-fields ${method === 'card' ? 'is-open' : ''}" data-card-fields>
          <p class="instapay-note is-open">${t('payment.cardRedirectNote')}</p>
        </div>

        <div class="card-fields ${method === 'instapay' ? 'is-open' : ''}" data-wallet-fields>
          <label class="span-2">${t('payment.walletNumber')}<input name="walletNumber" inputmode="tel" placeholder="01xxxxxxxxx" value="${ship.phone || ''}" maxlength="15" /></label>
        </div>

        <div class="instapay-note ${method === 'instapay' ? 'is-open' : ''}">
          ${t('payment.instapayNote', { amount: `<strong>${moneyFixed(total)}</strong>` })}
        </div>

        <button type="button" class="place-order-btn" data-place-order>
          ${t('payment.placeOrder', { amount: moneyFixed(total) })}
          <svg viewBox="0 0 24 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M0 6h22M17 1l5 5-5 5" />
          </svg>
        </button>
        <div class="secure-row">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v6c0 5 3.2 8.4 7 9 3.8-.6 7-4 7-9V6l-7-3z" stroke-width="1.5"/></svg>
          ${t('payment.secure')}
        </div>
      </div>

      <aside class="order-summary">
        <div class="order-summary-top">
          <span>${t('payment.summary')}</span>
          <span class="count">(${count})</span>
        </div>
        <div class="ship-box">
          <h2>${t('payment.shippingTo')}</h2>
          <p>
            ${ship.firstName} ${ship.lastName}<br />
            ${ship.address}<br />
            ${ship.city}${ship.region ? `, ${ship.region}` : ''} ${ship.postal}<br />
            ${ship.country}<br />
            ${ship.email}${ship.phone ? ` · ${ship.phone}` : ''}
          </p>
        </div>
        ${items
        .map((item) => {
          const product = getProduct(item.id);
          const size = item.size || product.size || t('product.freeSize');
          const sale =
            product.salePrice != null
              ? `<span class="sale-tag">${t('payment.sale')}</span>`
              : '';
          return `
            <div class="order-row">
              <img src="${product.images[0]}" alt="${product.name}" />
              <div>
                <p class="order-row-name">${product.name}${sale}</p>
                <p class="order-row-variant">${item.color} / ${size}</p>
                <div class="order-row-bottom"><span>(${item.qty})</span><span>${money(unitPrice(product) * item.qty)}</span></div>
              </div>
            </div>`;
        })
        .join('')}
        <div class="summary-row"><span>${t('cart.subtotal')}</span><span>${moneyFixed(subtotal)}</span></div>
        ${coupon ? `<div class="summary-row"><span>${t('cart.discount')} (${coupon.code})</span><span>-${moneyFixed(discount)}</span></div>` : ''}
        <div class="summary-row"><span>${t('cart.shipping')}</span><span>${moneyFixed(shippingFor(subtotal))}</span></div>
        <div class="summary-row total"><span>${t('cart.total')}</span><span>${moneyFixed(total)}</span></div>
      </aside>`;

    root.querySelectorAll('input[name="pay"]').forEach((input) => {
      input.addEventListener('change', () => {
        method = input.value;
        render();
      });
    });

    root.querySelector('[data-place-order]')?.addEventListener('click', async () => {
      const btn = root.querySelector('[data-place-order]');
      const walletNumber = String(root.querySelector('[name="walletNumber"]')?.value || '').trim();

      if (method === 'instapay' && !/^01[0-9]{9}$/.test(walletNumber)) {
        showToast(t('payment.cardInvalid'));
        return;
      }

      btn.disabled = true;
      btn.textContent = t('payment.placing');

      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            items: items.map((item) => ({
              id: item.id,
              color: item.color,
              size: item.size,
              qty: item.qty
            })),
            shipping: ship,
            paymentMethod: method,
            couponCode: coupon ? coupon.code : undefined
          })
        });
        let data = {};
        try {
          data = await res.json();
        } catch {
          data = {};
        }
        if (!res.ok) throw new Error(data.error || `Order failed (${res.status})`);

        // Cash on delivery needs no payment gateway — confirm right away.
        if (method === 'cod') {
          writeCart([]);
          clearCheckout();
          clearCoupon();
          root.innerHTML = `
            <div class="payment-success">
              <h1>${t('payment.thanks')}</h1>
              <p class="order-id">${t('payment.orderId', { id: data.order.id })}</p>
              <p>${t('payment.received', { email: ship.email })}</p>
              <a href="collections.html" class="btn-gold">${t('payment.continueShop')}</a>
            </div>`;
          showReceiptModal(data.order);
          return;
        }

        // Card / InstaPay: hand off to Paymob's hosted, PCI-compliant page.
        btn.textContent = t('payment.redirecting');
        const initRes = await fetch('/api/payments/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ orderId: data.order.id, walletNumber })
        });
        const initData = await initRes.json().catch(() => ({}));
        if (!initRes.ok || !initData.paymentUrl) {
          throw new Error(initData.error || t('payment.gatewayUnavailable'));
        }

        writeCart([]);
        clearCheckout();
        clearCoupon();
        window.location.href = initData.paymentUrl;
      } catch (err) {
        showToast(err.message || t('payment.failed'));
        btn.disabled = false;
        render();
      }
    });
  };

  render();
};

// Popup shown right after a successful order — a quick visual receipt on top
// of the inline "Thank you" confirmation.
function showReceiptModal(order) {
  const overlay = document.createElement('div');
  overlay.className = 'receipt-overlay';
  overlay.innerHTML = `
    <div class="receipt-modal" role="dialog" aria-modal="true" aria-label="${t('receipt.aria')}">
      <button type="button" class="receipt-close" aria-label="${t('receipt.close')}">&times;</button>
      <h2>${t('receipt.title')}</h2>
      <p class="receipt-code">${order.id}</p>
      <div class="receipt-items">
        ${order.items
          .map(
            (i) => `
          <div class="receipt-item">
            <span>${i.qty} × ${i.name} <small>(${i.color}/${i.size})</small></span>
            <span>${moneyFixed(i.lineTotal)}</span>
          </div>`
          )
          .join('')}
      </div>
      <div class="receipt-totals">
        <div><span>${t('receipt.subtotal')}</span><span>${moneyFixed(order.subtotal)}</span></div>
        ${order.discount ? `<div><span>${t('receipt.discount')}${order.couponCode ? ` (${order.couponCode})` : ''}</span><span>-${moneyFixed(order.discount)}</span></div>` : ''}
        <div><span>${t('receipt.shipping')}</span><span>${moneyFixed(order.shippingFee)}</span></div>
        <div class="receipt-total-row"><span>${t('receipt.total')}</span><span>${moneyFixed(order.total)}</span></div>
      </div>
      <p class="receipt-note">${t('receipt.note', { email: order.shipping.email })}</p>
      <button type="button" class="btn-gold full receipt-continue">${t('receipt.continue')}</button>
    </div>`;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const close = () => {
    overlay.remove();
    document.body.style.overflow = '';
  };

  overlay.querySelector('.receipt-close')?.addEventListener('click', close);
  overlay.querySelector('.receipt-continue')?.addEventListener('click', () => {
    close();
    window.location.href = 'collections.html';
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
}

/* ---- Account nav (injected into every page's header) ---- */
const initAccountNav = async () => {
  const rightContainers = document.querySelectorAll('.header-right');
  const mobileLists = document.querySelectorAll('.mobile-nav ul');
  if (!rightContainers.length) return;

  let customer = null;
  try {
    const res = await fetch('/api/account/me', { credentials: 'same-origin' });
    if (res.ok) {
      const data = await res.json();
      customer = data.customer;
    }
  } catch {
    /* not signed in / offline — treat as guest */
  }

  const href = customer ? 'orders.html' : 'account.html';
  const label = customer ? 'My Orders' : 'Sign In';
  const userIcon =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>';

  rightContainers.forEach((el) => {
    if (el.querySelector('[data-account-link]')) return;
    const link = document.createElement('a');
    link.href = href;
    link.className = 'icon-btn';
    link.setAttribute('aria-label', label);
    link.setAttribute('data-account-link', '');
    link.innerHTML = userIcon;
    const firstIcon = el.querySelector('.icon-btn, .phone-link');
    if (firstIcon) el.insertBefore(link, firstIcon);
    else el.appendChild(link);
  });

  mobileLists.forEach((ul) => {
    if (ul.querySelector('[data-account-link]')) return;
    const li = document.createElement('li');
    li.innerHTML = `<a href="${href}" data-account-link>${label}</a>`;
    ul.appendChild(li);
  });
};

/* ---- Account page (sign in / sign up via emailed code) ---- */
const initAccountPage = () => {
  const root = document.querySelector('[data-account-page]');
  if (!root) return;

  let stage = 'email'; // email -> code
  let email = '';

  const render = () => {
    root.innerHTML =
      stage === 'email'
        ? `
      <form data-request-form>
        <p class="form-section-label">${t('account.title')}</p>
        <p class="account-lead">${t('account.lead')}</p>
        <div class="form-grid single">
          <input type="email" name="email" placeholder="${t('account.emailLabel')}" required autocomplete="email" value="${email}" />
        </div>
        <button type="submit" class="payment-btn">${t('account.sendCode')}</button>
        <p class="account-message" data-message></p>
      </form>`
        : `
      <form data-verify-form>
        <p class="form-section-label">${t('account.codeLabel')}</p>
        <p class="account-lead">${t('account.codeSentTo', { email })}</p>
        <div class="form-grid single">
          <input type="text" name="code" inputmode="numeric" maxlength="6" placeholder="${t('account.codePlaceholder')}" required />
        </div>
        <button type="submit" class="payment-btn">${t('account.verify')}</button>
        <button type="button" class="link-btn" data-back>${t('account.backEmail')}</button>
        <p class="account-message" data-message></p>
      </form>`;

    root.querySelector('[data-request-form]')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      email = String(fd.get('email') || '').trim();
      const msg = root.querySelector('[data-message]');
      msg.textContent = t('account.sending');
      try {
        const res = await fetch('/api/account/request-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t('account.codeSendFail'));
        stage = 'code';
        render();
        showToast(data.message || t('account.codeSent'));
        if (data.devCode) showToast(t('account.devCode', { code: data.devCode }));
      } catch (err) {
        msg.textContent = err.message || t('account.codeSendFail');
      }
    });

    root.querySelector('[data-back]')?.addEventListener('click', () => {
      stage = 'email';
      render();
    });

    root.querySelector('[data-verify-form]')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const code = String(fd.get('code') || '').trim();
      const msg = root.querySelector('[data-message]');
      msg.textContent = t('account.verifying');
      try {
        const res = await fetch('/api/account/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t('account.incorrectCode'));
        window.location.href = 'orders.html';
      } catch (err) {
        msg.textContent = err.message || t('account.incorrectCode');
      }
    });
  };

  render();
};

/* ---- Order history page ---- */
const initOrdersPage = () => {
  const root = document.querySelector('[data-orders-page]');
  if (!root) return;

  const render = async () => {
    root.innerHTML = `<p class="account-lead">${t('orders.loading')}</p>`;
    let me;
    try {
      const meRes = await fetch('/api/account/me', { credentials: 'same-origin' });
      if (!meRes.ok) throw new Error('not signed in');
      me = (await meRes.json()).customer;
    } catch {
      root.innerHTML = `
        <div class="cart-empty">
          <p>${t('orders.signInPrompt')}</p>
          <a href="account.html" class="btn-gold">${t('nav.signIn')}</a>
        </div>`;
      return;
    }

    let orders = [];
    try {
      const res = await fetch('/api/account/orders', { credentials: 'same-origin' });
      const data = await res.json();
      orders = data.orders || [];
    } catch {
      orders = [];
    }

    root.innerHTML = `
      <div class="orders-head">
        <p>${t('account.signedInAs')} <strong>${me.email}</strong></p>
        <button type="button" class="link-btn" data-sign-out>${t('account.signOut')}</button>
      </div>
      ${
        orders.length
          ? orders
              .map(
                (o) => `
        <div class="order-history-card">
          <div class="order-history-top">
            <span class="order-history-id">${o.id}</span>
            <span class="order-history-status">${o.status.replace('_', ' ')}</span>
          </div>
          <p class="order-history-date">${(o.createdAt || '').slice(0, 10)} · ${o.paymentMethod}</p>
          ${o.items
            .map(
              (i) => `<div class="order-history-item"><span>${i.qty} × ${i.name} (${i.color}/${i.size})</span><span>${moneyFixed(i.lineTotal)}</span></div>`
            )
            .join('')}
          <div class="order-history-total"><span>${t('account.total')}</span><span>${moneyFixed(o.total)}</span></div>
        </div>`
              )
              .join('')
          : `<div class="cart-empty"><p>${t('account.noOrders')}</p><a href="collections.html" class="btn-gold">${t('home.shop')}</a></div>`
      }`;

    root.querySelector('[data-sign-out]')?.addEventListener('click', async () => {
      try {
        await fetch('/api/account/logout', { method: 'POST' });
      } catch {
        /* ignore */
      }
      window.location.href = 'index.html';
    });
  };

  render();
};

/* ---- Contact form ---- */
const initContactForm = () => {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('.contact-submit');
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get('name') || '').trim(),
      email: String(fd.get('email') || '').trim(),
      message: String(fd.get('message') || '').trim()
    };

    if (!payload.name || !payload.email || !payload.message) {
      showToast(t('contact.fillAll'));
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = t('contact.sending');
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('contact.fail'));

      form.reset();
      showToast(t('contact.sent'));
    } catch (err) {
      showToast(err.message || t('contact.fail'));
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = t('contact.send');
      }
    }
  });
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadCatalog();
  initMobileNav();
  initAccountNav();
  initHero();
  initCollections();
  initProductDetail();
  initCartPage();
  initCheckoutPage();
  initPaymentPage();
  initAccountPage();
  initOrdersPage();
  initContactForm();
  updateCartBadge();
});