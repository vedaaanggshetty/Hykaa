'use strict';

/* ============================================================
   PRODUCT DATA
   ============================================================ */
const PRODUCTS = [
  { id: 1,  name: 'Facial Cleanser',               price: 29.00, oldPrice: 39.00, img: './assets/images/product-01.jpg', badge: '-26%', rating: 5, reviews: 5170, category: 'cleanser' },
  { id: 2,  name: 'Bio-shroom Rejuvenating Serum', price: 29.00, oldPrice: null,  img: './assets/images/product-02.jpg', badge: null,   rating: 5, reviews: 5170, category: 'serum' },
  { id: 3,  name: 'Coffee Bean Caffeine Eye Cream',price: 29.00, oldPrice: null,  img: './assets/images/product-03.jpg', badge: null,   rating: 5, reviews: 5170, category: 'cream' },
  { id: 4,  name: 'Facial Cleanser Pro',           price: 29.00, oldPrice: null,  img: './assets/images/product-04.jpg', badge: null,   rating: 5, reviews: 5170, category: 'cleanser' },
  { id: 5,  name: 'Coffee Bean Eye Cream',         price: 29.00, oldPrice: 39.00, img: './assets/images/product-05.jpg', badge: '-26%', rating: 5, reviews: 5170, category: 'cream' },
  { id: 6,  name: 'Facial Cleanser Lite',          price: 29.00, oldPrice: null,  img: './assets/images/product-06.jpg', badge: null,   rating: 5, reviews: 5170, category: 'cleanser' },
  { id: 7,  name: 'Vitamin C Bright Serum',        price: 19.00, oldPrice: 29.00, img: './assets/images/product-07.jpg', badge: '-34%', rating: 5, reviews: 5170, category: 'serum' },
  { id: 8,  name: 'Bio-shroom Renew Serum',        price: 19.00, oldPrice: null,  img: './assets/images/product-08.jpg', badge: null,   rating: 5, reviews: 5170, category: 'serum' },
  { id: 9,  name: 'Rose Glow Moisturizer',         price: 22.00, oldPrice: null,  img: './assets/images/product-09.jpg', badge: null,   rating: 5, reviews: 3200, category: 'moisturizer' },
  { id: 10, name: 'Night Repair Cream',            price: 24.00, oldPrice: null,  img: './assets/images/product-10.jpg', badge: null,   rating: 5, reviews: 2800, category: 'cream' },
  { id: 11, name: 'Hydra-Boost Toner',             price: 18.00, oldPrice: null,  img: './assets/images/product-11.jpg', badge: null,   rating: 5, reviews: 1900, category: 'toner' },
  { id: 15, name: 'Soothing Aloe Gel',             price: 15.00, oldPrice: null,  img: './assets/images/product-15.jpg', badge: null,   rating: 5, reviews: 1500, category: 'gel' },
  { id: 16, name: 'SPF 50 Sunscreen',              price: 21.00, oldPrice: null,  img: './assets/images/product-16.jpg', badge: null,   rating: 5, reviews: 4100, category: 'sunscreen' },
  { id: 17, name: 'Exfoliating Scrub',             price: 17.00, oldPrice: 22.00, img: './assets/images/product-17.jpg', badge: '-22%', rating: 5, reviews: 2300, category: 'scrub' },
];

/* ============================================================
   COUPON CODES
   ============================================================ */
const COUPONS = {
  'HYKAA10': 0.10,  // 10% off
  'SKINCARE20': 0.20, // 20% off
  'WELCOME15': 0.15,  // 15% off
};

/* ============================================================
   STATE  (localStorage-backed)
   ============================================================ */
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
function addToCart(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const existing = cart.find(x => x.id === id);
  if (existing) { existing.qty++; } else { cart.push({ ...p, qty: 1 }); }
  save(); updateCartUI(); toast(`${p.name} added to cart 🛒`);
}

function removeFromCart(id) {
  cart = cart.filter(x => x.id !== id);
  save(); updateCartUI(); renderCartDrawer();
}

function changeQty(id, delta) {
  const item = cart.find(x => x.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty < 1) return removeFromCart(id);
  save(); updateCartUI(); renderCartDrawer();
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
  el.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.img}" alt="${item.name}">
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</p>
        <div class="qty-controls">
          <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${item.id})"><ion-icon name="trash-outline"></ion-icon></button>
    </div>
  `).join('');
  updateCartUI();
}

/* ============================================================
   WISHLIST
   ============================================================ */
function toggleWishlist(id) {
  const idx = wishlist.findIndex(x => x.id === id);
  if (idx > -1) {
    wishlist.splice(idx, 1);
    toast('Removed from wishlist', 'info');
  } else {
    const p = PRODUCTS.find(x => x.id === id);
    if (p) { wishlist.push(p); toast(`${p.name} added to wishlist ★`); }
  }
  save(); updateCartUI(); renderWishlistDrawer(); updateWishlistButtons();
}

function renderWishlistDrawer() {
  const el = document.getElementById('wishlist-items');
  if (!el) return;
  if (wishlist.length === 0) {
    el.innerHTML = `<div class="empty-state"><ion-icon name="star-outline"></ion-icon><p>Your wishlist is empty</p></div>`;
    return;
  }
  el.innerHTML = wishlist.map(item => `
    <div class="cart-item">
      <img src="${item.img}" alt="${item.name}">
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-price">$${item.price.toFixed(2)}</p>
        <button class="btn btn-primary btn-sm" onclick="addToCart(${item.id}); toggleWishlist(${item.id})">Move to Cart</button>
      </div>
      <button class="cart-item-remove" onclick="toggleWishlist(${item.id})"><ion-icon name="trash-outline"></ion-icon></button>
    </div>
  `).join('');
}

function updateWishlistButtons() {
  document.querySelectorAll('[data-wishlist-id]').forEach(btn => {
    const id = +btn.dataset.wishlistId;
    const inWL = wishlist.some(x => x.id === id);
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

  list.innerHTML = filtered.map(p => `
    <li class="scrollbar-item" data-category="${p.category}">
      <div class="shop-card" style="cursor:pointer" onclick="openQuickView(${p.id})">
        <div class="card-banner img-holder" style="--width: 540; --height: 720;">
          <img src="${p.img}" width="540" height="720" loading="lazy" alt="${p.name}" class="img-cover">
          ${p.badge ? `<span class="badge" aria-label="${p.badge} off">${p.badge}</span>` : ''}
          <div class="card-actions">
            <button class="action-btn" aria-label="add to cart" onclick="event.stopPropagation(); addToCart(${p.id})">
              <ion-icon name="bag-handle-outline" aria-hidden="true"></ion-icon>
            </button>
            <button class="action-btn" aria-label="add to whishlist" data-wishlist-id="${p.id}" onclick="event.stopPropagation(); toggleWishlist(${p.id})">
              <ion-icon name="${wishlist.some(w => w.id === p.id) ? 'star' : 'star-outline'}" aria-hidden="true"></ion-icon>
            </button>
            <button class="action-btn" aria-label="quick view" onclick="event.stopPropagation(); openQuickView(${p.id})">
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
            <a href="#" class="card-title" onclick="event.preventDefault(); openQuickView(${p.id})">${p.name}</a>
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
  `).join('');
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
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const stars = '★'.repeat(p.rating) + '☆'.repeat(5 - p.rating);
  const inWL = wishlist.some(x => x.id === id);
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
        <p class="qv-desc">A premium skincare formulation designed for all skin types. Made with clean, non-toxic, cruelty-free ingredients for a healthy, radiant glow.</p>
        <div class="qv-qty-row">
          <label>Quantity</label>
          <div class="qty-controls">
            <button class="qty-btn" id="qv-minus">−</button>
            <span id="qv-qty">1</span>
            <button class="qty-btn" id="qv-plus">+</button>
          </div>
        </div>
        <div class="qv-actions">
          <button class="btn btn-primary" id="qv-add-cart">Add to Cart</button>
          <button class="btn btn-outline qv-wl-btn" id="qv-wishlist" data-wishlist-id="${p.id}">
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
    for (let i = 0; i < qty; i++) addToCart(p.id);
    closeModal('qv');
  };
  document.getElementById('qv-wishlist').onclick = () => {
    toggleWishlist(p.id);
    const inWLnow = wishlist.some(x => x.id === p.id);
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

document.getElementById('login-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const pass  = document.getElementById('login-password').value;
  const users = JSON.parse(localStorage.getItem('hykaa_users') || '[]');
  const found = users.find(u => u.email === email && u.password === pass);
  if (found) {
    user = found;
    localStorage.setItem('hykaa_user', JSON.stringify(user));
    closeModal('auth');
    updateAuthBtn();
    toast(`Welcome back, ${user.name}! 👋`);
  } else {
    toast('Invalid credentials. Please try again.', 'error');
  }
});

document.getElementById('signup-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const name     = document.getElementById('signup-name').value;
  const email    = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const users    = JSON.parse(localStorage.getItem('hykaa_users') || '[]');
  if (users.find(u => u.email === email)) { toast('Email already registered.', 'error'); return; }
  const newUser = { name, email, password };
  users.push(newUser);
  localStorage.setItem('hykaa_users', JSON.stringify(users));
  user = newUser;
  localStorage.setItem('hykaa_user', JSON.stringify(user));
  closeModal('auth');
  updateAuthBtn();
  toast(`Account created! Welcome, ${name} 🎉`);
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

// Coupon code
document.getElementById('apply-coupon-btn')?.addEventListener('click', () => {
  const code = (document.getElementById('coupon-input')?.value || '').trim().toUpperCase();
  if (!code) { toast('Please enter a promo code.', 'error'); return; }
  if (appliedCoupon === code) { toast('Coupon already applied!', 'info'); return; }
  const discount = COUPONS[code];
  if (discount) {
    appliedCoupon  = code;
    couponDiscount = discount;
    toast(`🎉 Coupon applied! ${Math.round(discount * 100)}% off your order.`);
    renderCheckout();
  } else {
    toast('Invalid promo code.', 'error');
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

document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = document.getElementById('place-order-btn');
  if (btn) { btn.textContent = 'Processing...'; btn.disabled = true; }
  setTimeout(() => {
    const orderId = 'HYK' + Date.now().toString().slice(-8);
    const orderIdEl = document.getElementById('order-id');
    if (orderIdEl) orderIdEl.textContent = `Order ID: ${orderId}`;

    // Save order to localStorage
    const orders = JSON.parse(localStorage.getItem('hykaa_orders') || '[]');
    orders.push({
      id: orderId,
      items: [...cart],
      total: (cartTotal() * (1 - couponDiscount)).toFixed(2),
      date: new Date().toLocaleDateString(),
      coupon: appliedCoupon
    });
    localStorage.setItem('hykaa_orders', JSON.stringify(orders));

    cart = []; appliedCoupon = null; couponDiscount = 0;
    save(); updateCartUI(); renderCartDrawer();
    closeModal('checkout');
    openModal('success');
    if (btn) { btn.textContent = 'Place Order'; btn.disabled = false; }
  }, 1800);
});

/* ============================================================
   SEARCH
   ============================================================ */
const searchInput   = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

searchInput?.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) { searchResults.innerHTML = ''; searchResults.classList.remove('active'); return; }
  const matches = PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || p.category.includes(q));
  if (matches.length === 0) {
    searchResults.innerHTML = `<p class="no-results">No products found for "${q}"</p>`;
  } else {
    searchResults.innerHTML = matches.slice(0, 6).map(p => `
      <div class="search-item" onclick="openQuickView(${p.id}); searchResults.classList.remove('active'); searchInput.value=''">
        <img src="${p.img}" alt="${p.name}">
        <div>
          <p>${p.name}</p>
          <span>$${p.price.toFixed(2)}</span>
        </div>
      </div>
    `).join('');
  }
  searchResults.classList.add('active');
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
   NEWSLETTER
   ============================================================ */
document.getElementById('newsletter-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('newsletter-email')?.value;
  if (!email) return;
  const subscribers = JSON.parse(localStorage.getItem('hykaa_newsletter') || '[]');
  if (subscribers.includes(email)) {
    toast('You are already subscribed!', 'info');
  } else {
    subscribers.push(email);
    localStorage.setItem('hykaa_newsletter', JSON.stringify(subscribers));
    toast('Thank you for subscribing! 🎉');
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
      user = null; localStorage.removeItem('hykaa_user'); updateAuthBtn(); toast('Signed out.');
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
    addToCart(1); // Mountain Pine Bath Oil → mapped to product 1 (Facial Cleanser)
    toast('Offer product added to cart! 🎉');
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
renderProductCards('all');
initFilterTabs();
updateCartUI();
updateWishlistButtons();
updateAuthBtn();
startCountdown();
