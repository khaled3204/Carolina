/* ==========================================================================
   CAROLINA — shared behaviors + product catalog / cart / payment
   ========================================================================== */

const CART_KEY = 'carolina-cart';
const CHECKOUT_KEY = 'carolina-checkout';
const SHIPPING = 5;

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
const money = (n) => `$ ${Number(n).toFixed(Number.isInteger(n) ? 0 : 2)}`.replace(/\.00$/, '');
const moneyFixed = (n) => `$${Number(n).toFixed(2)}`;

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
  showToast('Added to cart');
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
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
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
    return `
    <a class="product-card" href="product.html?item=${encodeURIComponent(product.id)}">
      <div class="product-media">
        <img src="${product.images[0]}" alt="${product.name}" loading="lazy" />
      </div>
      <div class="product-info">
        <span class="product-name">${product.name}</span>
        ${priceHtml}
      </div>
    </a>`;
  }).join('');
};

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

  const render = () => {
    const priceBlock =
      product.salePrice != null
        ? `<p class="detail-price"><s style="opacity:.5;margin-right:10px;font-size:0.75em">${money(product.price)}</s>${money(product.salePrice)}${product.discountPercent ? ` <span style="font-size:12px;color:var(--gold-dark)">−${product.discountPercent}%</span>` : ''}</p>`
        : `<p class="detail-price">${money(product.price)}</p>`;

    root.innerHTML = `
      <h1>${product.name}</h1>
      <div class="thumb-col">
        ${product.images
          .map(
            (src, i) => `
          <button type="button" data-thumb class="${i === 0 ? 'active' : ''}" data-full="${src}" aria-label="View image ${i + 1}">
            <img src="${src}" alt="" />
          </button>`
          )
          .join('')}
      </div>
      <div class="main-image">
        <img data-main-image src="${product.images[0]}" alt="${product.name}" />
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
        ${
          sizes.length > 1
            ? `<div class="swatches" style="gap:8px">${sizes
                .map(
                  (s) =>
                    `<button type="button" class="btn-gold" style="padding:8px 14px;font-size:12px;background:${s === selectedSize ? 'var(--gold)' : 'var(--cream)'}" data-size="${s}">${s}</button>`
                )
                .join('')}</div>`
            : ''
        }
        <hr class="divider" />
        <h2>Description</h2>
        <p>${product.description || ''}</p>
        <button class="btn-gold full" type="button" data-add-to-cart>Add To Cart</button>
      </div>`;

    root.querySelectorAll('[data-thumb]').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        root.querySelectorAll('[data-thumb]').forEach((t) => t.classList.remove('active'));
        thumb.classList.add('active');
        const mainImg = root.querySelector('[data-main-image]');
        if (mainImg && thumb.dataset.full) mainImg.src = thumb.dataset.full;
      });
    });

    root.querySelectorAll('.swatch[data-color]').forEach((swatch) => {
      swatch.addEventListener('click', () => {
        selectedColor = swatch.dataset.color;
        root.querySelectorAll('.swatch[data-color]').forEach((s) => s.classList.remove('selected'));
        swatch.classList.add('selected');
        const label = root.querySelector('[data-color-label]');
        if (label) label.textContent = selectedColor;
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
      addToCart(product.id, selectedColor, 1, selectedSize);
    });
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
          <p>Your cart is empty.</p>
          <a href="collections.html" class="btn-gold">GO TO SHOP</a>
        </div>`;
      return;
    }

    const subtotal = cartSubtotal(items);
    const total = subtotal + SHIPPING;

    root.innerHTML = `
      <div class="cart-items">
        ${items
          .map((item, index) => {
            const product = getProduct(item.id);
            const line = unitPrice(product) * item.qty;
            const size = item.size || product.size || 'FREE SIZE';
            return `
            <div class="cart-row" data-index="${index}">
              <img src="${product.images[0]}" alt="${product.name}" />
              <div>
                <p class="cart-item-name">${product.name}</p>
                <p class="cart-item-variant">${item.color} / ${size}</p>
                <p class="cart-item-price">${money(unitPrice(product))}</p>
                <button type="button" class="cart-remove" data-remove>Remove</button>
              </div>
              <div class="qty-control">
                <button type="button" data-qty-dec aria-label="Decrease quantity">–</button>
                <span data-qty>${item.qty}</span>
                <button type="button" data-qty-inc aria-label="Increase quantity">+</button>
              </div>
              <div class="line-total">${money(line)}</div>
            </div>`;
          })
          .join('')}
      </div>
      <div class="summary-box">
        <div class="summary-row"><span>Subtotal</span><span>${moneyFixed(subtotal)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${moneyFixed(SHIPPING)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${moneyFixed(total)}</span></div>
        <a href="checkout.html" class="btn-gold">
          Check Out
          <svg viewBox="0 0 24 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M0 6h22M17 1l5 5-5 5" />
          </svg>
        </a>
      </div>`;

    root.querySelectorAll('.cart-row').forEach((row) => {
      const index = Number(row.dataset.index);
      row.querySelector('[data-qty-dec]')?.addEventListener('click', () => {
        const cart = readCart();
        if (cart[index].qty > 1) cart[index].qty -= 1;
        writeCart(cart);
        render();
      });
      row.querySelector('[data-qty-inc]')?.addEventListener('click', () => {
        const cart = readCart();
        cart[index].qty += 1;
        writeCart(cart);
        render();
      });
      row.querySelector('[data-remove]')?.addEventListener('click', () => {
        const cart = readCart();
        cart.splice(index, 1);
        writeCart(cart);
        render();
      });
    });
  };

  render();
};

/* ---- Checkout page ---- */
const initCheckoutPage = () => {
  const root = document.querySelector('[data-checkout-page]');
  if (!root) return;

  const render = () => {
    const items = readCart();

    if (!items.length) {
      root.innerHTML = `
        <div class="checkout-empty">
          <p>Your cart is empty.</p>
          <a href="collections.html" class="btn-gold">GO TO SHOP</a>
        </div>`;
      return;
    }

    const subtotal = cartSubtotal(items);
    const total = subtotal + SHIPPING;
    const count = cartQtyTotal(items);
    const saved = readCheckout()?.shipping || {};

    root.innerHTML = `
      <div>
        <h1>Checkout</h1>
        <form data-checkout-form>
          <p class="form-section-label">Contact Info</p>
          <div class="form-grid single">
            <input type="email" name="email" placeholder="Email" autocomplete="email" value="${saved.email || ''}" required />
            <input type="tel" name="phone" placeholder="Phone" autocomplete="tel" value="${saved.phone || ''}" />
          </div>

          <p class="form-section-label">Shipping Address</p>
          <div class="form-grid">
            <input type="text" name="firstName" placeholder="First Name" autocomplete="given-name" value="${saved.firstName || ''}" required />
            <input type="text" name="lastName" placeholder="Last Name" autocomplete="family-name" value="${saved.lastName || ''}" required />
            <input class="span-2" type="text" name="country" placeholder="Country" autocomplete="country-name" value="${saved.country || 'Egypt'}" required />
            <input class="span-2" type="text" name="region" placeholder="State / Region" autocomplete="address-level1" value="${saved.region || ''}" />
            <input class="span-2" type="text" name="address" placeholder="Address" autocomplete="street-address" value="${saved.address || ''}" required />
            <input type="text" name="city" placeholder="City" autocomplete="address-level2" value="${saved.city || ''}" required />
            <input type="text" name="postal" placeholder="Postal Code" autocomplete="postal-code" value="${saved.postal || ''}" required />
          </div>

          <button type="submit" class="payment-btn">
            Continue to payment
            <svg viewBox="0 0 24 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M0 6h22M17 1l5 5-5 5" />
            </svg>
          </button>
        </form>
      </div>

      <aside class="order-summary">
        <div class="order-summary-top">
          <span>YOUR ORDER</span>
          <span class="count">(${count})</span>
        </div>
        ${items
          .map((item, index) => {
            const product = getProduct(item.id);
            const size = item.size || product.size || 'FREE SIZE';
            return `
            <div class="order-row" data-index="${index}">
              <img src="${product.images[0]}" alt="${product.name}" />
              <div>
                <p class="order-row-name">
                  ${product.name}
                  <button type="button" data-remove>Remove</button>
                </p>
                <p class="order-row-variant">${item.color} / ${size}</p>
                <div class="order-row-bottom"><span>(${item.qty})</span><span>${money(unitPrice(product) * item.qty)}</span></div>
              </div>
            </div>`;
          })
          .join('')}
        <div class="summary-row"><span>Subtotal</span><span>${moneyFixed(subtotal)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${moneyFixed(SHIPPING)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${moneyFixed(total)}</span></div>
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
        <p>Your cart is empty.</p>
        <a href="collections.html" class="btn-gold">GO TO SHOP</a>
      </div>`;
    return;
  }

  if (!checkout?.shipping) {
    root.innerHTML = `
      <div class="payment-empty">
        <p>Please complete shipping details first.</p>
        <a href="checkout.html" class="btn-gold">Back to checkout</a>
      </div>`;
    return;
  }

  let method = 'cod';
  const ship = checkout.shipping;
  const subtotal = cartSubtotal(items);
  const total = subtotal + SHIPPING;
  const count = cartQtyTotal(items);

  const render = () => {
    root.innerHTML = `
      <div>
        <h1>Payment</h1>
        <p class="payment-lead">Choose how you’d like to pay. Your order is reserved once you confirm below.</p>

        <div class="pay-methods" role="radiogroup" aria-label="Payment method">
          <label class="pay-option ${method === 'cod' ? 'is-selected' : ''}">
            <input type="radio" name="pay" value="cod" ${method === 'cod' ? 'checked' : ''} />
            <div>
              <p class="pay-option-title">Cash on delivery</p>
              <p class="pay-option-desc">Pay when your Carolina order arrives.</p>
            </div>
            <span class="pay-badge">Popular</span>
          </label>
          <label class="pay-option ${method === 'card' ? 'is-selected' : ''}">
            <input type="radio" name="pay" value="card" ${method === 'card' ? 'checked' : ''} />
            <div>
              <p class="pay-option-title">Card</p>
              <p class="pay-option-desc">Visa / Mastercard — secure checkout.</p>
            </div>
          </label>
          <label class="pay-option ${method === 'instapay' ? 'is-selected' : ''}">
            <input type="radio" name="pay" value="instapay" ${method === 'instapay' ? 'checked' : ''} />
            <div>
              <p class="pay-option-title">InstaPay</p>
              <p class="pay-option-desc">Transfer then confirm your order.</p>
            </div>
          </label>
        </div>

        <div class="card-fields ${method === 'card' ? 'is-open' : ''}" data-card-fields>
          <label class="span-2">Name on card<input name="cardName" autocomplete="cc-name" placeholder="Full name" /></label>
          <label class="span-2">Card number<input name="cardNumber" inputmode="numeric" autocomplete="cc-number" placeholder="•••• •••• •••• ••••" maxlength="19" /></label>
          <label>Expiry<input name="cardExp" autocomplete="cc-exp" placeholder="MM/YY" maxlength="5" /></label>
          <label>CVC<input name="cardCvc" inputmode="numeric" autocomplete="cc-csc" placeholder="•••" maxlength="4" /></label>
        </div>

        <div class="instapay-note ${method === 'instapay' ? 'is-open' : ''}">
          Transfer <strong>${moneyFixed(total)}</strong> via InstaPay, then place your order.
          Use your order email as the transfer reference. Our team will confirm payment shortly.
        </div>

        <button type="button" class="place-order-btn" data-place-order>
          Place order · ${moneyFixed(total)}
          <svg viewBox="0 0 24 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M0 6h22M17 1l5 5-5 5" />
          </svg>
        </button>
        <div class="secure-row">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v6c0 5 3.2 8.4 7 9 3.8-.6 7-4 7-9V6l-7-3z" stroke-width="1.5"/></svg>
          Encrypted session · Carolina never stores full card numbers
        </div>
      </div>

      <aside class="order-summary">
        <div class="order-summary-top">
          <span>ORDER SUMMARY</span>
          <span class="count">(${count})</span>
        </div>
        <div class="ship-box">
          <h2>Shipping to</h2>
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
            const size = item.size || product.size || 'FREE SIZE';
            const sale =
              product.salePrice != null
                ? `<span class="sale-tag">Sale</span>`
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
        <div class="summary-row"><span>Subtotal</span><span>${moneyFixed(subtotal)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${moneyFixed(SHIPPING)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${moneyFixed(total)}</span></div>
      </aside>`;

    root.querySelectorAll('input[name="pay"]').forEach((input) => {
      input.addEventListener('change', () => {
        method = input.value;
        render();
      });
    });

    const cardNumber = root.querySelector('[name="cardNumber"]');
    cardNumber?.addEventListener('input', () => {
      const digits = cardNumber.value.replace(/\D/g, '').slice(0, 16);
      cardNumber.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    });

    const cardExp = root.querySelector('[name="cardExp"]');
    cardExp?.addEventListener('input', () => {
      let v = cardExp.value.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
      cardExp.value = v;
    });

    root.querySelector('[data-place-order]')?.addEventListener('click', async () => {
      const btn = root.querySelector('[data-place-order]');
      let cardLast4 = null;

      if (method === 'card') {
        const number = String(root.querySelector('[name="cardNumber"]')?.value || '').replace(/\D/g, '');
        const name = String(root.querySelector('[name="cardName"]')?.value || '').trim();
        const exp = String(root.querySelector('[name="cardExp"]')?.value || '').trim();
        const cvc = String(root.querySelector('[name="cardCvc"]')?.value || '').trim();
        if (!name || !luhnOk(number) || !/^\d{2}\/\d{2}$/.test(exp) || cvc.length < 3) {
          showToast('Please check your card details');
          return;
        }
        cardLast4 = number.slice(-4);
      }

      btn.disabled = true;
      btn.textContent = 'Placing order…';

      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((item) => ({
              id: item.id,
              color: item.color,
              size: item.size,
              qty: item.qty
            })),
            shipping: ship,
            paymentMethod: method,
            cardLast4
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Order failed');

        writeCart([]);
        clearCheckout();
        root.innerHTML = `
          <div class="payment-success">
            <h1>Thank you</h1>
            <p class="order-id">Order ${data.order.id}</p>
            <p>We’ve received your order and will be in touch shortly.</p>
            <a href="collections.html" class="btn-gold">Continue shopping</a>
          </div>`;
      } catch (err) {
        showToast(err.message || 'Could not place order');
        btn.disabled = false;
        render();
      }
    });
  };

  render();
};

/* ---- Contact form ---- */
const initContactForm = () => {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.reset();
    showToast('Message sent — we will reply soon');
  });
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadCatalog();
  initMobileNav();
  initHero();
  initCollections();
  initProductDetail();
  initCartPage();
  initCheckoutPage();
  initPaymentPage();
  initContactForm();
  updateCartBadge();
});
