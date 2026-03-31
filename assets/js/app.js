'use strict';

/* ============================================================
   API CONFIGURATION
   ============================================================ */
const API_BASE = '/api';

/* ============================================================
   API HELPER
   ============================================================ */
async function api(endpoint, options = {}) {
  const token = localStorage.getItem('hykaa_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API error');
  return data;
}

/* ============================================================
   STATE  (localStorage-backed, syncs with server when logged in)
   ============================================================ */
let PRODUCTS = [];
let cart     = JSON.parse(localStorage.getItem('hykaa_cart'))     || [];
let wishlist = JSON.parse(localStorage.getItem('hykaa_wishlist')) || [];
let user     = JSON.parse(localStorage.getItem('hykaa_user'))     || null;
let appliedCoupon = null;
let couponDiscount = 0;

const save = () => {
  localStorage.setItem('hykaa_cart',     JSON.stringify(cart));
  localStorage.setItem('hykaa_wishlist', JSON.stringify(wishlist));
};

/* ============================================================
   LOAD PRODUCTS FROM API
   ============================================================ */
async function loadProducts() {
  try {
    PRODUCTS = await api('/products');
    renderProductCards('all');
    initFilterTabs();
    updateWishlistButtons();
  } catch (err) {
    console.error('Failed to load products from API, using empty list:', err.message);
    PRODUCTS = [];
  }
}

/* ============================================================
   SYNC CART & WISHLIST WITH SERVER (when logged in)
   ============================================================ */
async function syncCartFromServer() {
  if (!localStorage.getItem('hykaa_token')) return;
  try {
    cart = await api('/cart');
    save();
    updateCartUI();
    renderCartDrawer();
  } catch (err) {
    console.error('Failed to sync cart:', err.message);
  }
}

async function syncWishlistFromServer() {
  if (!localStorage.getItem('hykaa_token')) return;
  try {
    wishlist = await api('/wishlist');
    save();
    updateCartUI();
    updateWishlistButtons();
  } catch (err) {
    console.error('Failed to sync wishlist:', err.message);
  }
}

/* ============================================================
   TOAST
   ============================================================ */
function toast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.innerHTML = `<span>${msg}</span>`;
  c.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, 2800);
}

/* ============================================================
   CART
   ============================================================ */
async function addToCart(id) {
  const p = PRODUCTS.find(x => (x._id || x.id) === id || x.id === id);
  if (!p) return;
  const productId = p._id || p.id;

  if (localStorage.getItem('hykaa_token')) {
    try {
      cart = await api('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: p._id, qty: 1 }),
      });
      save();
    } catch (err) {
      toast(err.message, 'error');
      return;
    }
  } else {
    const existing = cart.find(x => (x._id || x.id) === productId);
    if (existing) { existing.qty++; } else { cart.push({ ...p, qty: 1 }); }
    save();
  }
  updateCartUI();
  renderCartDrawer();
  openDrawer('cart');
  toast(`${p.name} added to cart 🛒`);
}

async function removeFromCart(id) {
  if (localStorage.getItem('hykaa_token')) {
    try {
      await api(`/cart/${id}`, { method: 'DELETE' });
      cart = cart.filter(x => (x._id || x.id) !== id);
      save();
    } catch (err) {
      toast(err.message, 'error');
      return;
    }
  } else {
    cart = cart.filter(x => (x._id || x.id) !== id);
    save();
  }
  updateCartUI();
  renderCartDrawer();
}

async function changeQty(id, delta) {
  const item = cart.find(x => (x._id || x.id) === id);
  if (!item) return;
  const newQty = item.qty + delta;
  if (newQty < 1) return removeFromCart(id);

  if (localStorage.getItem('hykaa_token')) {
    try {
      await api(`/cart/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ qty: newQty }),
      });
      item.qty = newQty;
      save();
    } catch (err) {
      toast(err.message, 'error');
      return;
    }
  } else {
    item.qty = newQty;
    save();
  }
  updateCartUI();
  renderCartDrawer();
}

function cartTotal() { return cart.reduce((s, x) => s + x.price * x.qty, 0); }
function cartCount() { return cart.reduce((s, x) => s + x.qty, 0); }

function updateCartUI() {
  const count = cartCount();
  const total = cartTotal();
  const countEl = document.getElementById('cart-count');
  if (countEl) countEl.textContent = count;
  const wlCountEl = document.getElementById('wishlist-count');
  if (wlCountEl) wlCountEl.textContent = wishlist.length;
  const ct = document.getElementById('cart-total');
  if (ct) { ct.textContent = `$${total.toFixed(2)}`; ct.value = total.toFixed(2); }
  const sd = document.getElementById('cart-subtotal-drawer');
  if (sd) sd.textContent = `$${total.toFixed(2)}`;
}

function renderCartDrawer() {
  const el = document.getElementById('cart-items');
  if (!el) return;
  if (cart.length === 0) {
    el.innerHTML = `<div class="empty-state"><ion-icon name="bag-handle-outline"></ion-icon><p>Your cart is empty</p></div>`;
    return;
  }
  el.innerHTML = cart.map(item => {
    const itemId = item._id || item.id;
    return `
    <div class="cart-item">
      <img src="${item.img}" alt="${item.name}">
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</p>
        <div class="qty-controls">
          <button class="qty-btn" onclick="changeQty('${itemId}', -1)">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${itemId}', 1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${itemId}')"><ion-icon name="trash-outline"></ion-icon></button>
    </div>
  `;}).join('');
  updateCartUI();
}

/* ============================================================
   WISHLIST
   ============================================================ */
async function toggleWishlist(id) {
  if (localStorage.getItem('hykaa_token')) {
    try {
      const result = await api(`/wishlist/${id}`, { method: 'POST' });
      wishlist = result.wishlist;
      save();
      toast(result.action === 'added' ? `Added to wishlist ★` : 'Removed from wishlist', result.action === 'added' ? 'success' : 'info');
    } catch (err) {
      toast(err.message, 'error');
      return;
    }
  } else {
    const p = PRODUCTS.find(x => (x._id || x.id) === id);
    const idx = wishlist.findIndex(x => (x._id || x.id) === id);
    if (idx > -1) {
      wishlist.splice(idx, 1);
      toast('Removed from wishlist', 'info');
    } else {
      if (p) { wishlist.push(p); toast(`${p.name} added to wishlist ★`); }
    }
    save();
  }
  updateCartUI();
  renderWishlistDrawer();
  updateWishlistButtons();
}

function renderWishlistDrawer() {
  const el = document.getElementById('wishlist-items');
  if (!el) return;
  if (wishlist.length === 0) {
    el.innerHTML = `<div class="empty-state"><ion-icon name="star-outline"></ion-icon><p>Your wishlist is empty</p></div>`;
    return;
  }
  el.innerHTML = wishlist.map(item => {
    const itemId = item._id || item.id;
    return `
    <div class="cart-item">
      <img src="${item.img}" alt="${item.name}">
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-price">$${item.price.toFixed(2)}</p>
        <button class="btn btn-primary btn-sm" onclick="addToCart('${itemId}'); toggleWishlist('${itemId}')">Move to Cart</button>
      </div>
      <button class="cart-item-remove" onclick="toggleWishlist('${itemId}')"><ion-icon name="trash-outline"></ion-icon></button>
    </div>
  `;}).join('');
}

function updateWishlistButtons() {
  document.querySelectorAll('[data-wishlist-id]').forEach(btn => {
    const id = btn.dataset.wishlistId;
    const inWL = wishlist.some(x => (x._id || x.id) === id || x.id === +id);
    const ico = btn.querySelector('ion-icon');
    if (ico) ico.setAttribute('name', inWL ? 'star' : 'star-outline');
    btn.style.color = inWL ? 'var(--hoockers-green)' : '';
  });
}

/* ============================================================
   PRODUCT CARD RENDERING (dynamic cards from PRODUCTS array)
   ============================================================ */
function renderProductCards(filter = 'all') {
  const list = document.getElementById('product-list');
  if (!list) return;

  const filtered = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);

  list.innerHTML = filtered.map(p => {
    const pid = p._id || p.id;
    return `
    <li class="scrollbar-item" data-category="${p.category}">
      <div class="shop-card" style="cursor:pointer" onclick="openQuickView('${pid}')">
        <div class="card-banner img-holder" style="--width: 540; --height: 720;">
          <img src="${p.img}" width="540" height="720" loading="lazy" alt="${p.name}" class="img-cover">
          ${p.badge ? `<span class="badge" aria-label="${p.badge} off">${p.badge}</span>` : ''}
          <div class="card-actions">
            <button class="action-btn" aria-label="add to cart" onclick="event.stopPropagation(); addToCart('${pid}')">
              <ion-icon name="bag-handle-outline" aria-hidden="true"></ion-icon>
            </button>
            <button class="action-btn" aria-label="add to whishlist" data-wishlist-id="${pid}" onclick="event.stopPropagation(); toggleWishlist('${pid}')">
              <ion-icon name="${wishlist.some(w => (w._id || w.id) === pid) ? 'star' : 'star-outline'}" aria-hidden="true"></ion-icon>
            </button>
            <button class="action-btn" aria-label="quick view" onclick="event.stopPropagation(); openQuickView('${pid}')">
              <ion-icon name="eye-outline" aria-hidden="true"></ion-icon>
            </button>
          </div>
        </div>
        <div class="card-content">
          <div class="price">
            ${p.oldPrice ? `<del class="del">$${p.oldPrice.toFixed(2)}</del>` : ''}
            <span class="span">$${p.price.toFixed(2)}</span>
          </div>
          <h3>
            <a href="#" class="card-title" onclick="event.preventDefault(); openQuickView('${pid}')">${p.name}</a>
          </h3>
          <div class="card-rating">
            <div class="rating-wrapper" aria-label="${p.rating} star rating">
              ${Array.from({length: 5}, (_, i) => `<ion-icon name="${i < p.rating ? 'star' : 'star-outline'}" aria-hidden="true"></ion-icon>`).join('')}
            </div>
            <p class="rating-text">${p.reviews.toLocaleString()} reviews</p>
          </div>
        </div>
      </div>
    </li>
  `;}).join('');
}

/* ============================================================
   CATEGORY FILTER TABS
   ============================================================ */
function initFilterTabs() {
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderProductCards(tab.dataset.filter);
    });
  });
}

/* ============================================================
   QUICK VIEW MODAL
   ============================================================ */
function openQuickView(id) {
  const p = PRODUCTS.find(x => (x._id || x.id) === id);
  if (!p) return;
  const pid = p._id || p.id;
  const stars = '★'.repeat(p.rating) + '☆'.repeat(5 - p.rating);
  const inWL = wishlist.some(x => (x._id || x.id) === pid);
  const desc = p.description || 'A premium skincare formulation designed for all skin types. Made with clean, non-toxic, cruelty-free ingredients for a healthy, radiant glow.';
  document.getElementById('qv-content').innerHTML = `
    <div class="qv-grid">
      <div class="qv-image">
        <img src="${p.img}" alt="${p.name}">
        ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
      </div>
      <div class="qv-details">
        <h2>${p.name}</h2>
        <div class="qv-rating">
          <span class="stars">${stars}</span>
          <span class="reviews">(${p.reviews.toLocaleString()} reviews)</span>
        </div>
        <div class="qv-price">
          ${p.oldPrice ? `<del>$${p.oldPrice.toFixed(2)}</del>` : ''}
          <span class="current-price">$${p.price.toFixed(2)}</span>
        </div>
        <p class="qv-desc">${desc}</p>
        <div class="qv-qty-row">
          <label>Quantity</label>
          <div class="qty-controls">
            <button class="qty-btn" id="qv-minus">−</button>
            <span id="qv-qty">1</span>
            <button class="qty-btn" id="qv-plus">+</button>
          </div>
        </div>
        <div class="qv-actions" style="display: flex; gap: 12px; margin-top: 10px;">
          <button class="btn btn-primary" id="qv-add-cart" style="display: flex; align-items: center; gap: 10px; flex: 1; justify-content: center;">
            <ion-icon name="bag-handle-outline"></ion-icon>
            Add to Cart
          </button>
          <button class="btn btn-outline qv-wl-btn" id="qv-wishlist" data-wishlist-id="${pid}" style="display: flex; align-items: center; gap: 10px; flex: 1; justify-content: center;">
            <ion-icon name="${inWL ? 'star' : 'star-outline'}"></ion-icon>
            ${inWL ? 'Wishlisted' : 'Wishlist'}
          </button>
        </div>
      </div>
    </div>
  `;
  let qty = 1;
  document.getElementById('qv-minus').onclick = () => { if (qty > 1) { qty--; document.getElementById('qv-qty').textContent = qty; } };
  document.getElementById('qv-plus').onclick  = () => { qty++; document.getElementById('qv-qty').textContent = qty; };
  document.getElementById('qv-add-cart').onclick = () => {
    for (let i = 0; i < qty; i++) addToCart(pid);
    closeModal('qv');
  };
  document.getElementById('qv-wishlist').onclick = () => {
    toggleWishlist(pid);
    const inWLnow = wishlist.some(x => (x._id || x.id) === pid);
    document.getElementById('qv-wishlist').innerHTML = `<ion-icon name="${inWLnow ? 'star' : 'star-outline'}"></ion-icon> ${inWLnow ? 'Wishlisted' : 'Wishlist'}`;
  };
  openModal('qv');
}

/* ============================================================
   MODALS & DRAWERS
   ============================================================ */
function openModal(name) {
  const overlay = document.getElementById(`${name}-overlay`);
  const modal   = document.getElementById(`${name}-modal`);
  if (overlay) overlay.classList.add('active');
  if (modal)   modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal(name) {
  const overlay = document.getElementById(`${name}-overlay`);
  const modal   = document.getElementById(`${name}-modal`);
  if (overlay) overlay.classList.remove('active');
  if (modal)   modal.classList.remove('active');
  document.body.style.overflow = '';
}
function openDrawer(name) {
  const overlay = document.getElementById(`${name}-overlay`);
  const drawer  = document.getElementById(`${name}-drawer`);
  if (overlay) overlay.classList.add('active');
  if (drawer)  drawer.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeDrawer(name) {
  const overlay = document.getElementById(`${name}-overlay`);
  const drawer  = document.getElementById(`${name}-drawer`);
  if (overlay) overlay.classList.remove('active');
  if (drawer)  drawer.classList.remove('active');
  document.body.style.overflow = '';
}

/* ============================================================
   AUTH
   ============================================================ */
function updateAuthBtn() {
  const btn = document.getElementById('auth-btn');
  if (!btn) return;
  if (user) {
    btn.innerHTML = `<ion-icon name="person" aria-hidden="true"></ion-icon>`;
    btn.title = `Hi, ${user.name}`;
  } else {
    btn.innerHTML = `<ion-icon name="person-outline" aria-hidden="true"></ion-icon>`;
    btn.title = '';
  }
}

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const pass  = document.getElementById('login-password').value;

  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });
    user = { _id: data._id, name: data.name, email: data.email };
    localStorage.setItem('hykaa_user', JSON.stringify(user));
    localStorage.setItem('hykaa_token', data.token);
    closeModal('auth');
    updateAuthBtn();
    toast(`Welcome back, ${user.name}! 👋`);
    // Sync cart & wishlist from server
    syncCartFromServer();
    syncWishlistFromServer();
  } catch (err) {
    toast(err.message || 'Invalid credentials. Please try again.', 'error');
  }
});

document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name     = document.getElementById('signup-name').value;
  const email    = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    user = { _id: data._id, name: data.name, email: data.email };
    localStorage.setItem('hykaa_user', JSON.stringify(user));
    localStorage.setItem('hykaa_token', data.token);
    closeModal('auth');
    updateAuthBtn();
    toast(`Account created! Welcome, ${name} 🎉`);
  } catch (err) {
    toast(err.message || 'Registration failed.', 'error');
  }
});

// Auth tab switching
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panelEl = document.getElementById(`${tab.dataset.tab}-panel`);
    if (panelEl) panelEl.classList.add('active');
  });
});

document.querySelectorAll('[data-switch]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = link.dataset.switch;
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === target));
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.toggle('active', p.id === `${target}-panel`));
  });
});

/* ============================================================
   CHECKOUT
   ============================================================ */
function renderCheckout() {
  const itemsEl    = document.getElementById('checkout-items');
  const subtotalEl = document.getElementById('summary-subtotal');
  const totalEl    = document.getElementById('summary-total');
  const discountEl = document.getElementById('summary-discount');

  if (!itemsEl) return;

  itemsEl.innerHTML = cart.map(item => `
    <div class="checkout-item">
      <img src="${item.img}" alt="${item.name}">
      <span>${item.name} × ${item.qty}</span>
      <span>$${(item.price * item.qty).toFixed(2)}</span>
    </div>
  `).join('') || '<p style="color:var(--spanish-gray);font-size:1.4rem">No items in cart.</p>';

  const subtotal = cartTotal();
  const discount = couponDiscount > 0 ? subtotal * couponDiscount : 0;
  const total    = subtotal - discount;

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (discountEl) discountEl.textContent = discount > 0 ? `-$${discount.toFixed(2)}` : '—';
  if (totalEl)    totalEl.textContent    = `$${total.toFixed(2)}`;
}

// Coupon code — validate via API
document.getElementById('apply-coupon-btn')?.addEventListener('click', async () => {
  const code = (document.getElementById('coupon-input')?.value || '').trim().toUpperCase();
  if (!code) { toast('Please enter a promo code.', 'error'); return; }
  if (appliedCoupon === code) { toast('Coupon already applied!', 'info'); return; }

  try {
    const data = await api('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    appliedCoupon  = data.code;
    couponDiscount = data.discount;
    toast(`🎉 Coupon applied! ${data.percentOff}% off your order.`);
    renderCheckout();
  } catch (err) {
    toast(err.message || 'Invalid promo code.', 'error');
  }
});

// Payment method toggle
document.querySelectorAll('[name="payment"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const cardFields = document.getElementById('card-fields');
    if (cardFields) cardFields.style.display = radio.value === 'card' ? 'block' : 'none';
  });
});

// Card number formatting
document.getElementById('card-number')?.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
});
document.getElementById('card-expiry')?.addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, '');
  if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2);
  e.target.value = v.slice(0, 5);
});

document.getElementById('checkout-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('place-order-btn');
  if (btn) { btn.textContent = 'Processing...'; btn.disabled = true; }

  const isLoggedIn = !!localStorage.getItem('hykaa_token');

  setTimeout(async () => {
    if (isLoggedIn) {
      try {
        const order = await api('/orders', {
          method: 'POST',
          body: JSON.stringify({
            items: cart,
            couponCode: appliedCoupon,
            paymentMethod: document.querySelector('[name="payment"]:checked')?.value || 'cod',
            shippingAddress: {
              fullName: document.getElementById('checkout-name')?.value,
              address: document.getElementById('checkout-address')?.value,
              city: document.getElementById('checkout-city')?.value,
              zip: document.getElementById('checkout-zip')?.value,
              phone: document.getElementById('checkout-phone')?.value,
            },
          }),
        });
        const orderIdEl = document.getElementById('order-id');
        if (orderIdEl) orderIdEl.textContent = `Order ID: ${order._id.slice(-8).toUpperCase()}`;
      } catch (err) {
        toast(err.message, 'error');
        if (btn) { btn.textContent = 'Place Order'; btn.disabled = false; }
        return;
      }
    } else {
      const orderId = 'HYK' + Date.now().toString().slice(-8);
      const orderIdEl = document.getElementById('order-id');
      if (orderIdEl) orderIdEl.textContent = `Order ID: ${orderId}`;

      // Save order to localStorage for guests
      const orders = JSON.parse(localStorage.getItem('hykaa_orders') || '[]');
      orders.push({
        id: orderId,
        items: [...cart],
        total: (cartTotal() * (1 - couponDiscount)).toFixed(2),
        date: new Date().toLocaleDateString(),
        coupon: appliedCoupon,
      });
      localStorage.setItem('hykaa_orders', JSON.stringify(orders));
    }

    cart = []; appliedCoupon = null; couponDiscount = 0;
    save(); updateCartUI(); renderCartDrawer();
    closeModal('checkout');
    openModal('success');
    if (btn) { btn.textContent = 'Place Order'; btn.disabled = false; }
  }, 1800);
});

/* ============================================================
   SEARCH — uses API when available
   ============================================================ */
const searchInput   = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

let searchTimeout = null;
searchInput?.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) { searchResults.innerHTML = ''; searchResults.classList.remove('active'); return; }

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    let matches;
    try {
      matches = await api(`/products/search?q=${encodeURIComponent(q)}`);
    } catch {
      // Fallback to local search
      matches = PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || p.category.includes(q));
    }

    if (matches.length === 0) {
      searchResults.innerHTML = `<p class="no-results">No products found for "${q}"</p>`;
    } else {
      searchResults.innerHTML = matches.slice(0, 6).map(p => {
        const pid = p._id || p.id;
        return `
        <div class="search-item" onclick="openQuickView('${pid}'); searchResults.classList.remove('active'); searchInput.value=''">
          <img src="${p.img}" alt="${p.name}">
          <div>
            <p>${p.name}</p>
            <span>$${p.price.toFixed(2)}</span>
          </div>
        </div>
      `;}).join('');
    }
    searchResults.classList.add('active');
  }, 300); // debounce 300ms
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.input-wrapper')) {
    searchResults?.classList.remove('active');
  }
});

/* ============================================================
   LIVE COUNTDOWN (Offer Section)
   ============================================================ */
function startCountdown() {
  const stored = localStorage.getItem('hykaa_offer_end');
  let target;
  if (!stored || isNaN(new Date(stored).getTime()) || new Date(stored) < new Date()) {
    target = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 + 21 * 60 * 60 * 1000 + 46 * 60 * 1000 + 8000);
    localStorage.setItem('hykaa_offer_end', target.toISOString());
  } else { target = new Date(stored); }

  const times = document.querySelectorAll('.offer .time');
  if (!times.length) return;
  setInterval(() => {
    const diff = target - new Date();
    if (diff <= 0) { times.forEach(t => t.textContent = '00'); return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const vals = [d, h, m, s];
    times.forEach((t, i) => t.textContent = String(vals[i]).padStart(2, '0'));
  }, 1000);
}

/* ============================================================
   NEWSLETTER — uses API
   ============================================================ */
document.getElementById('newsletter-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('newsletter-email')?.value;
  if (!email) return;

  try {
    const data = await api('/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    toast(data.message || 'Thank you for subscribing! 🎉');
  } catch (err) {
    toast(err.message || 'Subscription failed.', 'error');
  }
  document.getElementById('newsletter-email').value = '';
});

/* ============================================================
   BUTTON WIRING
   ============================================================ */
// Cart
document.getElementById('cart-btn')?.addEventListener('click', () => { renderCartDrawer(); openDrawer('cart'); });
document.getElementById('cart-close')?.addEventListener('click', () => closeDrawer('cart'));
document.getElementById('cart-overlay')?.addEventListener('click', () => closeDrawer('cart'));

// Wishlist
document.getElementById('wishlist-btn')?.addEventListener('click', () => { renderWishlistDrawer(); openDrawer('wishlist'); });
document.getElementById('wishlist-close')?.addEventListener('click', () => closeDrawer('wishlist'));
document.getElementById('wishlist-overlay')?.addEventListener('click', () => closeDrawer('wishlist'));

// Auth
document.getElementById('auth-btn')?.addEventListener('click', () => {
  if (user) {
    if (confirm(`Logged in as ${user.name}. Sign out?`)) {
      user = null;
      localStorage.removeItem('hykaa_user');
      localStorage.removeItem('hykaa_token');
      // Reset to local-only state
      cart = [];
      wishlist = [];
      save();
      updateAuthBtn();
      updateCartUI();
      renderCartDrawer();
      renderWishlistDrawer();
      updateWishlistButtons();
      toast('Signed out.');
    }
  } else { openModal('auth'); }
});
document.getElementById('auth-close')?.addEventListener('click', () => closeModal('auth'));
document.getElementById('auth-overlay')?.addEventListener('click', () => closeModal('auth'));

// Quick View
document.getElementById('qv-close')?.addEventListener('click', () => closeModal('qv'));
document.getElementById('qv-overlay')?.addEventListener('click', () => closeModal('qv'));

// Checkout
document.getElementById('checkout-open-btn')?.addEventListener('click', () => {
  if (cart.length === 0) { toast('Your cart is empty!', 'error'); return; }
  closeDrawer('cart');
  renderCheckout();
  openModal('checkout');
});
document.getElementById('checkout-close')?.addEventListener('click', () => closeModal('checkout'));
document.getElementById('checkout-overlay')?.addEventListener('click', () => closeModal('checkout'));
document.getElementById('continue-shopping')?.addEventListener('click', () => closeDrawer('cart'));

// Order success
document.getElementById('success-close')?.addEventListener('click', () => closeModal('success'));
document.getElementById('success-overlay')?.addEventListener('click', () => closeModal('success'));

// Offer Section – "Get Only $39.00" → add offer product to cart
document.querySelectorAll('.section.offer .btn-primary').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const firstProduct = PRODUCTS[0];
    if (firstProduct) {
      addToCart(firstProduct._id || firstProduct.id);
      toast('Offer product added to cart! 🎉');
    }
  });
});

// Shop Now buttons → scroll to shop
document.querySelectorAll('.hero .btn-primary').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
  });
});

// Escape key to close modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    ['auth', 'qv', 'checkout', 'success'].forEach(name => closeModal(name));
    ['cart', 'wishlist'].forEach(name => closeDrawer(name));
  }
});

/* ============================================================
   INIT
   ============================================================ */
async function init() {
  await loadProducts();
  updateCartUI();
  updateAuthBtn();
  startCountdown();

  // If logged in, sync from server
  if (localStorage.getItem('hykaa_token')) {
    syncCartFromServer();
    syncWishlistFromServer();
  }
}

init();
