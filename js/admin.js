/* ==========================================================================
   CAROLINA — Admin panel
   ========================================================================== */

(() => {
  const TOKEN_KEY = 'carolina-admin-token';
  const app = document.querySelector('[data-admin-app]');
  if (!app) return;

  const state = {
    view: 'login', // login | forgot | reset | dashboard
    tab: 'products',
    token: localStorage.getItem(TOKEN_KEY) || '',
    user: null,
    products: [],
    sales: [],
    orders: [],
    editingId: null,
    message: '',
    error: '',
    resetToken: new URLSearchParams(location.search).get('reset') || ''
  };

  const money = (n) => `$${Number(n).toFixed(2)}`;

  function imageSrc(src) {
    const s = String(src || '').trim();
    if (!s) return '';
    if (/^(https?:|data:|blob:)/i.test(s)) return s;
    return `/${s.replace(/^\//, '')}`;
  }

  async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (state.token) headers.Authorization = `Bearer ${state.token}`;
    const res = await fetch(path, { ...options, headers, credentials: 'same-origin' });
    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    if (!res.ok) {
      const err = new Error(data.error || `Request failed (${res.status})`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function setToken(token) {
    state.token = token || '';
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function boot() {
    if (state.resetToken) {
      state.view = 'reset';
      render();
      return;
    }
    if (state.token) {
      try {
        const me = await api('/api/auth/me');
        state.user = { username: me.username, email: me.email };
        state.view = 'dashboard';
        await loadDashboard();
      } catch {
        setToken('');
        state.view = 'login';
      }
    }
    render();
  }

  async function loadDashboard() {
    const [productsRes, salesRes, ordersRes] = await Promise.all([
      api('/api/products?all=1'),
      api('/api/sales'),
      api('/api/orders')
    ]);
    state.products = productsRes.products || [];
    state.sales = salesRes.sales || [];
    state.orders = ordersRes.orders || [];
  }

  function render() {
    if (state.view === 'login') return renderAuth('login');
    if (state.view === 'forgot') return renderAuth('forgot');
    if (state.view === 'reset') return renderAuth('reset');
    renderDashboard();
  }

  function renderAuth(mode) {
    const titles = {
      login: { h: 'Admin sign in', p: 'Manage socks, sales, and orders' },
      forgot: { h: 'Reset access', p: 'We will email a reset link to your registered address' },
      reset: { h: 'Set new credentials', p: 'Choose a new username and password' }
    };
    const t = titles[mode];

    app.innerHTML = `
      <div class="auth-screen">
        <div class="auth-card">
          <div class="auth-brand">
            <img src="/images/Carolina_logo.svg" alt="Carolina" />
            <h1>${t.h}</h1>
            <p>${t.p}</p>
          </div>
          ${state.error ? `<p class="form-error">${escapeHtml(state.error)}</p>` : ''}
          ${state.message ? `<p class="form-success">${escapeHtml(state.message)}</p>` : ''}
          <form class="auth-form" data-auth-form="${mode}">
            ${
              mode === 'login'
                ? `
              <label>Username<input name="username" autocomplete="username" required /></label>
              <label>Password<input name="password" type="password" autocomplete="current-password" required /></label>
              <div class="auth-actions">
                <button class="btn-admin" type="submit">Sign in</button>
              </div>
              <div class="auth-links">
                <button type="button" data-go="forgot">Forgot password?</button>
              </div>`
                : ''
            }
            ${
              mode === 'forgot'
                ? `
              <label>Registered email
                <input name="email" type="email" placeholder="shop.carolina.eg@gmail.com" required />
              </label>
              <div class="auth-actions">
                <button class="btn-admin" type="submit">Send reset link</button>
                <button class="btn-admin ghost" type="button" data-go="login">Back to sign in</button>
              </div>`
                : ''
            }
            ${
              mode === 'reset'
                ? `
              <label>New username<input name="username" autocomplete="username" placeholder="carolina" /></label>
              <label>New password<input name="password" type="password" autocomplete="new-password" minlength="8" required /></label>
              <label>Confirm password<input name="confirm" type="password" autocomplete="new-password" minlength="8" required /></label>
              <div class="auth-actions">
                <button class="btn-admin" type="submit">Save credentials</button>
                <button class="btn-admin ghost" type="button" data-go="login">Back to sign in</button>
              </div>`
                : ''
            }
          </form>
        </div>
      </div>`;

    app.querySelectorAll('[data-go]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.view = btn.dataset.go;
        state.error = '';
        state.message = '';
        render();
      });
    });

    app.querySelector('[data-auth-form]')?.addEventListener('submit', onAuthSubmit);
  }

  async function onAuthSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const mode = form.dataset.authForm;
    const data = Object.fromEntries(new FormData(form).entries());
    state.error = '';
    state.message = '';

    try {
      if (mode === 'login') {
        const res = await api('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username: data.username, password: data.password })
        });
        setToken(res.token);
        state.user = { username: res.username, email: res.email };
        state.view = 'dashboard';
        await loadDashboard();
      } else if (mode === 'forgot') {
        const res = await api('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: data.email })
        });
        state.message = res.message || 'If that email is registered, a reset link has been sent.';
        if (res.resetUrl) {
          state.message += ` Dev link: ${res.resetUrl}`;
        }
      } else if (mode === 'reset') {
        if (data.password !== data.confirm) throw new Error('Passwords do not match');
        const res = await api('/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({
            token: state.resetToken,
            password: data.password,
            username: data.username
          })
        });
        state.message = res.message || 'Credentials updated.';
        state.resetToken = '';
        history.replaceState({}, '', '/admin/');
        state.view = 'login';
      }
    } catch (err) {
      state.error = err.message || 'Something went wrong';
    }
    render();
  }

  function renderDashboard() {
    const revenue = state.orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    app.innerHTML = `
      <header class="admin-top">
        <div class="admin-top-brand">
          <img src="/images/Carolina_logo.svg" alt="" />
          <div>
            <strong>Carolina Admin</strong>
            <span>Signed in as ${escapeHtml(state.user?.username || 'carolina')}</span>
          </div>
        </div>
        <div class="admin-top-actions">
          <a class="btn-admin ghost small" href="/" target="_blank" rel="noopener">View shop</a>
          <button class="btn-admin ghost small" type="button" data-logout>Sign out</button>
        </div>
      </header>
      <div class="admin-layout">
        <nav class="admin-nav" aria-label="Admin sections">
          <button type="button" data-tab="overview" class="${state.tab === 'overview' ? 'is-active' : ''}">Overview</button>
          <button type="button" data-tab="products" class="${state.tab === 'products' ? 'is-active' : ''}">Socks</button>
          <button type="button" data-tab="sales" class="${state.tab === 'sales' ? 'is-active' : ''}">Sales</button>
          <button type="button" data-tab="orders" class="${state.tab === 'orders' ? 'is-active' : ''}">Orders</button>
          <button type="button" data-tab="settings" class="${state.tab === 'settings' ? 'is-active' : ''}">Credentials</button>
        </nav>
        <main class="admin-main">
          ${state.error ? `<p class="form-error">${escapeHtml(state.error)}</p>` : ''}
          ${state.message ? `<p class="form-success">${escapeHtml(state.message)}</p>` : ''}

          <section class="panel ${state.tab === 'overview' ? 'is-active' : ''}">
            <div class="panel-head">
              <div>
                <h2>Overview</h2>
                <p>Snapshot of catalog, promotions, and recent sales.</p>
              </div>
            </div>
            <div class="stats-row">
              <div class="stat-tile"><span>Socks</span><strong>${state.products.length}</strong></div>
              <div class="stat-tile"><span>Active sales</span><strong>${state.sales.filter((s) => s.active).length}</strong></div>
              <div class="stat-tile"><span>Orders / revenue</span><strong>${state.orders.length} · ${money(revenue)}</strong></div>
            </div>
            <div class="admin-card">
              <h3>Recent orders</h3>
              ${renderOrdersTable(state.orders.slice(0, 5))}
            </div>
          </section>

          <section class="panel ${state.tab === 'products' ? 'is-active' : ''}">
            <div class="panel-head">
              <div>
                <h2>Socks catalog</h2>
                <p>Add, edit, or remove socks — name, colors, sizes, price, images.</p>
              </div>
              <button class="btn-admin small" type="button" data-new-product>New sock</button>
            </div>
            <div class="admin-grid">
              <div class="admin-card">
                <h3>${state.editingId ? 'Edit sock' : 'Add sock'}</h3>
                ${renderProductForm()}
              </div>
              <div class="admin-card">
                <h3>All socks</h3>
                ${renderProductsTable()}
              </div>
            </div>
          </section>

          <section class="panel ${state.tab === 'sales' ? 'is-active' : ''}">
            <div class="panel-head">
              <div>
                <h2>Sales & discounts</h2>
                <p>Create promotions or remove them anytime.</p>
              </div>
            </div>
            <div class="admin-grid">
              <div class="admin-card">
                <h3>Add sale</h3>
                ${renderSaleForm()}
              </div>
              <div class="admin-card">
                <h3>Current sales</h3>
                ${renderSalesTable()}
              </div>
            </div>
          </section>

          <section class="panel ${state.tab === 'orders' ? 'is-active' : ''}">
            <div class="panel-head">
              <div>
                <h2>Orders</h2>
                <p>Customer purchases from the payment page. Remove if needed.</p>
              </div>
            </div>
            <div class="admin-card">${renderOrdersTable(state.orders)}</div>
          </section>

          <section class="panel ${state.tab === 'settings' ? 'is-active' : ''}">
            <div class="panel-head">
              <div>
                <h2>Credentials</h2>
                <p>Change username, password, or recovery email (${escapeHtml(state.user?.email || '')}).</p>
              </div>
            </div>
            <div class="admin-card" style="max-width:520px">
              <form class="admin-form" data-credentials-form>
                <label>Current password<input name="currentPassword" type="password" required /></label>
                <label>New username<input name="username" value="${escapeHtml(state.user?.username || '')}" /></label>
                <label>Recovery email<input name="email" type="email" value="${escapeHtml(state.user?.email || '')}" /></label>
                <label>New password <span style="font-weight:300">(optional)</span>
                  <input name="password" type="password" minlength="8" placeholder="Leave blank to keep current" />
                </label>
                <button class="btn-admin" type="submit">Save changes</button>
              </form>
            </div>
          </section>
        </main>
      </div>`;

    bindDashboard();
  }

  function renderImageSlots(images) {
    const list = (images || []).filter(Boolean);
    if (!list.length) {
      return '<p class="empty-hint" style="margin:0">No photos yet — upload below.</p>';
    }
    return list
      .map(
        (src, i) => `
      <div class="image-slot" data-image-slot>
        <img src="${escapeHtml(imageSrc(src))}" alt="" />
        <input type="hidden" name="imageUrl" value="${escapeHtml(src)}" />
        <button type="button" class="btn-admin danger small" data-remove-image title="Remove">✕</button>
        <span class="image-slot-label">${i === 0 ? 'Main' : i + 1}</span>
      </div>`
      )
      .join('');
  }

  function renderProductForm() {
    const p = state.products.find((x) => x.id === state.editingId) || {
      name: '',
      price: '',
      stock: 20,
      description: '',
      images: [],
      colors: [{ name: 'BLACK', hex: '#111111' }],
      sizes: ['FREE SIZE'],
      active: true
    };

    const colors = (p.colors || []).map(
      (c, i) => `
      <div class="color-row" data-color-row>
        <input name="colorName" value="${escapeHtml(c.name)}" placeholder="Color name" required />
        <input name="colorHex" type="color" value="${escapeHtml(c.hex || '#cccccc')}" />
        <button type="button" class="btn-admin ghost small" data-remove-color ${i === 0 ? 'disabled' : ''}>✕</button>
      </div>`
    ).join('');

    return `
      <form class="admin-form" data-product-form>
        <label>Name<input name="name" value="${escapeHtml(p.name)}" required /></label>
        <div class="row-2">
          <label>Price<input name="price" type="number" min="0" step="0.01" value="${escapeHtml(p.price)}" required /></label>
          <label>Stock<input name="stock" type="number" min="0" step="1" value="${escapeHtml(p.stock ?? 0)}" /></label>
        </div>
        <label>Sizes <span style="font-weight:300">(comma separated)</span>
          <input name="sizes" value="${escapeHtml((p.sizes || [p.size || 'FREE SIZE']).join(', '))}" />
        </label>
        <div class="color-builder">
          <span style="font-family:var(--font-nav);font-size:12px;letter-spacing:0.05em;color:var(--ink-soft)">Colors</span>
          <div data-color-list>${colors}</div>
          <button type="button" class="btn-admin ghost small" data-add-color>+ Color</button>
        </div>
        <div class="image-builder">
          <span style="font-family:var(--font-nav);font-size:12px;letter-spacing:0.05em;color:var(--ink-soft)">Pictures</span>
          <div class="image-slots" data-image-list>${renderImageSlots(p.images)}</div>
          <div class="image-upload-row">
            <label class="btn-admin ghost small image-file-label">
              Upload photos
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden data-image-file />
            </label>
            <span class="upload-status" data-upload-status></span>
          </div>
          <label>Or paste image URL
            <div class="url-add-row">
              <input type="url" data-image-url-input placeholder="https://… or images/products/…" />
              <button type="button" class="btn-admin ghost small" data-add-image-url>Add</button>
            </div>
          </label>
        </div>
        <label>Description<textarea name="description">${escapeHtml(p.description || '')}</textarea></label>
        <label style="display:flex;align-items:center;gap:8px;grid-template-columns:auto 1fr">
          <input name="active" type="checkbox" ${p.active !== false ? 'checked' : ''} style="width:auto" />
          Visible in shop
        </label>
        <div class="row-actions">
          <button class="btn-admin" type="submit">${state.editingId ? 'Update sock' : 'Add sock'}</button>
          ${state.editingId ? '<button class="btn-admin ghost" type="button" data-cancel-edit>Cancel</button>' : ''}
        </div>
      </form>`;
  }

  function renderProductsTable() {
    if (!state.products.length) return '<p class="empty-hint">No socks yet. Add your first style.</p>';
    return `
      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th></th><th>Name</th><th>Price</th><th>Sizes</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            ${state.products
              .map((p) => {
                const price =
                  p.salePrice != null
                    ? `<span class="price-was">${money(p.price)}</span>${money(p.salePrice)}`
                    : money(p.price);
                return `
                <tr>
                  <td><img class="thumb" src="${escapeHtml(imageSrc(p.images?.[0]))}" alt="" /></td>
                  <td>
                    <div>${escapeHtml(p.name)}</div>
                    <div style="color:var(--ink-soft);font-size:11px">${escapeHtml((p.colors || []).map((c) => c.name).join(', '))}</div>
                  </td>
                  <td>${price}</td>
                  <td>${escapeHtml((p.sizes || [p.size]).filter(Boolean).join(', '))}</td>
                  <td><span class="badge ${p.active !== false ? 'on' : 'off'}">${p.active !== false ? 'Live' : 'Hidden'}</span></td>
                  <td>
                    <div class="row-actions">
                      <button class="btn-admin ghost small" type="button" data-edit-product="${escapeHtml(p.id)}">Edit</button>
                      <button class="btn-admin danger small" type="button" data-delete-product="${escapeHtml(p.id)}">Delete</button>
                    </div>
                  </td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>`;
  }

  function renderSaleForm() {
    const options = state.products
      .map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`)
      .join('');
    return `
      <form class="admin-form" data-sale-form>
        <label>Sale name<input name="name" placeholder="Spring 20% off" required /></label>
        <label>Discount %<input name="discountPercent" type="number" min="1" max="90" value="20" required /></label>
        <label>Apply to products
          <select name="productIds" multiple size="6">
            <option value="">All products</option>
            ${options}
          </select>
        </label>
        <p style="margin:0;font-size:12px;color:var(--ink-soft)">Hold Ctrl/Cmd to select specific socks. Leave “All products” alone for storewide.</p>
        <div class="row-2">
          <label>Starts<input name="startsAt" type="datetime-local" /></label>
          <label>Ends<input name="endsAt" type="datetime-local" /></label>
        </div>
        <button class="btn-admin" type="submit">Add sale</button>
      </form>`;
  }

  function renderSalesTable() {
    if (!state.sales.length) return '<p class="empty-hint">No sales yet.</p>';
    return `
      <div class="table-wrap">
        <table class="admin-table">
          <thead><tr><th>Name</th><th>Discount</th><th>Scope</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${state.sales
              .map((s) => {
                const scope = !s.productIds?.length
                  ? 'All products'
                  : `${s.productIds.length} sock(s)`;
                return `
                <tr>
                  <td>${escapeHtml(s.name)}</td>
                  <td>${escapeHtml(s.discountPercent)}%</td>
                  <td>${escapeHtml(scope)}</td>
                  <td><span class="badge ${s.active ? 'on' : 'off'}">${s.active ? 'Active' : 'Off'}</span></td>
                  <td>
                    <div class="row-actions">
                      <button class="btn-admin ghost small" type="button" data-toggle-sale="${escapeHtml(s.id)}">${s.active ? 'Disable' : 'Enable'}</button>
                      <button class="btn-admin danger small" type="button" data-delete-sale="${escapeHtml(s.id)}">Delete</button>
                    </div>
                  </td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>`;
  }

  function renderOrdersTable(orders) {
    if (!orders.length) return '<p class="empty-hint">No orders yet.</p>';
    return `
      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>Order</th><th>Customer</th><th>Payment</th><th>Total</th><th>Date</th><th></th></tr>
          </thead>
          <tbody>
            ${orders
              .map((o) => {
                const name = `${o.shipping?.firstName || ''} ${o.shipping?.lastName || ''}`.trim();
                return `
                <tr>
                  <td>
                    <div>${escapeHtml(o.id)}</div>
                    <div style="color:var(--ink-soft);font-size:11px">${escapeHtml(o.status)}</div>
                  </td>
                  <td>
                    <div>${escapeHtml(name)}</div>
                    <div style="color:var(--ink-soft);font-size:11px">${escapeHtml(o.shipping?.email || '')}</div>
                  </td>
                  <td>${escapeHtml(o.paymentMethod || '')}${o.cardLast4 ? ` ·•••${escapeHtml(o.cardLast4)}` : ''}</td>
                  <td>${money(o.total)}</td>
                  <td>${escapeHtml((o.createdAt || '').slice(0, 16).replace('T', ' '))}</td>
                  <td>
                    <button class="btn-admin danger small" type="button" data-delete-order="${escapeHtml(o.id)}">Remove</button>
                  </td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>`;
  }

  function bindDashboard() {
    app.querySelector('[data-logout]')?.addEventListener('click', async () => {
      try {
        await api('/api/auth/logout', { method: 'POST', body: '{}' });
      } catch {
        /* ignore */
      }
      setToken('');
      state.user = null;
      state.view = 'login';
      state.error = '';
      state.message = '';
      render();
    });

    app.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.tab = btn.dataset.tab;
        state.error = '';
        state.message = '';
        render();
      });
    });

    app.querySelector('[data-new-product]')?.addEventListener('click', () => {
      state.editingId = null;
      state.tab = 'products';
      render();
    });

    app.querySelector('[data-cancel-edit]')?.addEventListener('click', () => {
      state.editingId = null;
      render();
    });

    app.querySelector('[data-add-color]')?.addEventListener('click', () => {
      const list = app.querySelector('[data-color-list]');
      if (!list) return;
      const row = document.createElement('div');
      row.className = 'color-row';
      row.dataset.colorRow = '';
      row.innerHTML = `
        <input name="colorName" placeholder="Color name" required />
        <input name="colorHex" type="color" value="#c9a15c" />
        <button type="button" class="btn-admin ghost small" data-remove-color>✕</button>`;
      list.appendChild(row);
      row.querySelector('[data-remove-color]')?.addEventListener('click', () => row.remove());
    });

    app.querySelectorAll('[data-remove-color]').forEach((btn) => {
      btn.addEventListener('click', () => btn.closest('[data-color-row]')?.remove());
    });

    function collectImageUrls() {
      return [...app.querySelectorAll('[name="imageUrl"]')]
        .map((el) => el.value.trim())
        .filter(Boolean);
    }

    function refreshImageSlots(urls) {
      const list = app.querySelector('[data-image-list]');
      if (!list) return;
      list.innerHTML = renderImageSlots(urls);
      list.querySelectorAll('[data-remove-image]').forEach((btn) => {
        btn.addEventListener('click', () => {
          btn.closest('[data-image-slot]')?.remove();
          if (!list.querySelector('[data-image-slot]')) {
            list.innerHTML = '<p class="empty-hint" style="margin:0">No photos yet — upload below.</p>';
          } else {
            refreshImageSlots(collectImageUrls());
          }
        });
      });
    }

    app.querySelectorAll('[data-remove-image]').forEach((btn) => {
      btn.addEventListener('click', () => {
        btn.closest('[data-image-slot]')?.remove();
        refreshImageSlots(collectImageUrls());
      });
    });

    app.querySelector('[data-add-image-url]')?.addEventListener('click', () => {
      const input = app.querySelector('[data-image-url-input]');
      const url = input?.value.trim();
      if (!url) return;
      const urls = collectImageUrls();
      urls.push(url);
      refreshImageSlots(urls);
      if (input) input.value = '';
    });

    async function fileToDataUrl(file) {
      const maxSide = 1400;
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const w = Math.round(bitmap.width * scale);
      const h = Math.round(bitmap.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0, w, h);
      bitmap.close?.();
      const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const quality = type === 'image/jpeg' ? 0.85 : undefined;
      return {
        dataUrl: canvas.toDataURL(type, quality),
        contentType: type,
        filename: file.name
      };
    }

    app.querySelector('[data-image-file]')?.addEventListener('change', async (e) => {
      const input = e.currentTarget;
      const files = [...(input.files || [])];
      if (!files.length) return;
      const status = app.querySelector('[data-upload-status]');
      const urls = collectImageUrls();
      try {
        for (let i = 0; i < files.length; i++) {
          if (status) status.textContent = `Uploading ${i + 1}/${files.length}…`;
          const prepared = await fileToDataUrl(files[i]);
          const res = await api('/api/upload', {
            method: 'POST',
            body: JSON.stringify({
              data: prepared.dataUrl,
              contentType: prepared.contentType,
              filename: prepared.filename
            })
          });
          if (res.url) urls.push(res.url);
          if (res.warning) state.message = res.warning;
        }
        refreshImageSlots(urls);
        if (status) status.textContent = 'Uploaded.';
        setTimeout(() => {
          if (status) status.textContent = '';
        }, 2000);
      } catch (err) {
        if (status) status.textContent = '';
        state.error = err.message || 'Upload failed';
        render();
        return;
      } finally {
        input.value = '';
      }
    });

    app.querySelector('[data-product-form]')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
      const colorNames = [...form.querySelectorAll('[name="colorName"]')].map((el) => el.value.trim());
      const colorHexes = [...form.querySelectorAll('[name="colorHex"]')].map((el) => el.value);
      const colors = colorNames.map((name, i) => ({ name, hex: colorHexes[i] || '#cccccc' })).filter((c) => c.name);
      const images = collectImageUrls();
      if (!images.length) {
        state.error = 'Add at least one picture.';
        state.message = '';
        render();
        return;
      }
      const payload = {
        name: fd.get('name'),
        price: fd.get('price'),
        stock: fd.get('stock'),
        sizes: String(fd.get('sizes') || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        images,
        description: fd.get('description'),
        active: form.querySelector('[name="active"]')?.checked !== false,
        colors
      };

      try {
        if (state.editingId) {
          await api(`/api/products/${encodeURIComponent(state.editingId)}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
          });
          state.message = 'Sock updated.';
        } else {
          await api('/api/products', { method: 'POST', body: JSON.stringify(payload) });
          state.message = 'Sock added.';
        }
        state.editingId = null;
        state.error = '';
        await loadDashboard();
      } catch (err) {
        state.error = err.message;
        state.message = '';
      }
      render();
    });

    app.querySelectorAll('[data-edit-product]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.editingId = btn.dataset.editProduct;
        state.tab = 'products';
        render();
      });
    });

    app.querySelectorAll('[data-delete-product]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this sock from the catalog?')) return;
        try {
          await api(`/api/products/${encodeURIComponent(btn.dataset.deleteProduct)}`, {
            method: 'DELETE'
          });
          state.message = 'Sock deleted.';
          if (state.editingId === btn.dataset.deleteProduct) state.editingId = null;
          await loadDashboard();
        } catch (err) {
          state.error = err.message;
        }
        render();
      });
    });

    app.querySelector('[data-sale-form]')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
      const selected = [...form.querySelectorAll('[name="productIds"] option:checked')]
        .map((o) => o.value)
        .filter(Boolean);
      const payload = {
        name: fd.get('name'),
        discountPercent: fd.get('discountPercent'),
        productIds: selected,
        startsAt: fd.get('startsAt') ? new Date(String(fd.get('startsAt'))).toISOString() : undefined,
        endsAt: fd.get('endsAt') ? new Date(String(fd.get('endsAt'))).toISOString() : null,
        active: true
      };
      try {
        await api('/api/sales', { method: 'POST', body: JSON.stringify(payload) });
        state.message = 'Sale added.';
        state.error = '';
        await loadDashboard();
      } catch (err) {
        state.error = err.message;
      }
      render();
    });

    app.querySelectorAll('[data-delete-sale]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove this sale?')) return;
        try {
          await api(`/api/sales/${encodeURIComponent(btn.dataset.deleteSale)}`, { method: 'DELETE' });
          state.message = 'Sale removed.';
          await loadDashboard();
        } catch (err) {
          state.error = err.message;
        }
        render();
      });
    });

    app.querySelectorAll('[data-toggle-sale]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const sale = state.sales.find((s) => s.id === btn.dataset.toggleSale);
        if (!sale) return;
        try {
          await api(`/api/sales/${encodeURIComponent(sale.id)}`, {
            method: 'PUT',
            body: JSON.stringify({ ...sale, active: !sale.active })
          });
          state.message = sale.active ? 'Sale disabled.' : 'Sale enabled.';
          await loadDashboard();
        } catch (err) {
          state.error = err.message;
        }
        render();
      });
    });

    app.querySelectorAll('[data-delete-order]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove this order?')) return;
        try {
          await api(`/api/orders/${encodeURIComponent(btn.dataset.deleteOrder)}`, {
            method: 'DELETE'
          });
          state.message = 'Order removed.';
          await loadDashboard();
        } catch (err) {
          state.error = err.message;
        }
        render();
      });
    });

    app.querySelector('[data-credentials-form]')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      try {
        const res = await api('/api/auth/credentials', {
          method: 'PUT',
          body: JSON.stringify({
            currentPassword: fd.get('currentPassword'),
            username: fd.get('username'),
            email: fd.get('email'),
            password: fd.get('password') || undefined
          })
        });
        setToken(res.token);
        state.user = { username: res.username, email: res.email };
        state.message = 'Credentials updated.';
        state.error = '';
        e.currentTarget.reset();
      } catch (err) {
        state.error = err.message;
        state.message = '';
      }
      render();
    });
  }

  boot();
})();
