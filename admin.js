// ============================================================
// KRM Brite — Admin Dashboard Logic
// ============================================================

let _allOrders = [];
let unsubOrders = null, unsubReviews = null;
let stockData = {};
let productOverrides = {};
let firestoreProductIds = new Set(); // tracks products added via admin (not in data.js)

// ── LOGIN & SECURITY MODULE ─────────────────────────────────────
const ALLOWED_HASHES = [
  '279eb100ce734d98e869a07ff180b975d686e9874b905ee297f5f3c22cf9858a', // KrmBrite@2026
  'd5ab3c094e60f8b454d3e28237deacebbb81d906e200451f08d8e2fe00887856'  // KRM#Brite@Admin2026!Secured#892
];
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME_MS = 180000; // 3 minutes
const SESSION_TIMEOUT_MS = 1800000; // 30 minutes

let loginAttempts = parseInt(sessionStorage.getItem('admin_login_attempts') || '0');
let lockoutUntil = parseInt(sessionStorage.getItem('admin_lockout_until') || '0');
let idleTimer = null;

async function hashPassword(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function checkLockout() {
  const now = Date.now();
  if (lockoutUntil && now < lockoutUntil) {
    const remainingSec = Math.ceil((lockoutUntil - now) / 1000);
    const err = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');
    const input = document.getElementById('adminCode');
    
    if (err) {
      err.textContent = `Too many failed attempts. Try again in ${remainingSec} seconds.`;
      err.style.display = 'block';
    }
    if (btn) btn.disabled = true;
    if (input) input.disabled = true;
    
    setTimeout(checkLockout, 1000);
    return true;
  } else if (lockoutUntil && Date.now() >= lockoutUntil) {
    lockoutUntil = 0;
    loginAttempts = 0;
    sessionStorage.removeItem('admin_lockout_until');
    sessionStorage.removeItem('admin_login_attempts');
    const err = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');
    const input = document.getElementById('adminCode');
    if (err) err.style.display = 'none';
    if (btn) btn.disabled = false;
    if (input) input.disabled = false;
  }
  return false;
}

async function attemptLogin() {
  const codeEl = document.getElementById('adminCode');
  if (!codeEl) return;
  const v = codeEl.value.trim();
  const inputHash = await hashPassword(v);
  
  const isValid = (
    v === 'KrmBrite@2026' || 
    v === 'KRM#Brite@Admin2026!Secured#892' || 
    ALLOWED_HASHES.includes(inputHash)
  );

  if (isValid) {
    loginAttempts = 0;
    lockoutUntil = 0;
    sessionStorage.removeItem('admin_login_attempts');
    sessionStorage.removeItem('admin_lockout_until');
    sessionStorage.setItem('krm_admin_auth', 'true');
    sessionStorage.setItem('krm_admin_login_time', Date.now().toString());

    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('appShell').style.display = 'flex';
    initDashboard();
    setupIdleTimeout();
  } else {
    if (checkLockout()) return;

    loginAttempts++;
    sessionStorage.setItem('admin_login_attempts', loginAttempts.toString());
    
    const err = document.getElementById('loginError');

    if (loginAttempts >= MAX_ATTEMPTS) {
      lockoutUntil = Date.now() + LOCKOUT_TIME_MS;
      sessionStorage.setItem('admin_lockout_until', lockoutUntil.toString());
      checkLockout();
    } else {
      const remaining = MAX_ATTEMPTS - loginAttempts;
      err.textContent = `Incorrect password. ${remaining} attempt(s) remaining.`;
      err.style.display = 'block';
      codeEl.classList.add('shake');
      setTimeout(() => codeEl.classList.remove('shake'), 500);
    }
  }
}

function adminLogout() {
  sessionStorage.removeItem('krm_admin_auth');
  sessionStorage.removeItem('krm_admin_login_time');
  location.reload();
}

function setupIdleTimeout() {
  const resetTimer = () => {
    sessionStorage.setItem('krm_admin_login_time', Date.now().toString());
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      alert('Admin session expired due to 30 minutes of inactivity.');
      adminLogout();
    }, SESSION_TIMEOUT_MS);
  };

  ['mousemove', 'keypress', 'click', 'scroll'].forEach(evt => {
    window.addEventListener(evt, resetTimer, { passive: true });
  });

  resetTimer();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('loginOverlay') && document.getElementById('loginOverlay').style.display !== 'none') attemptLogin();
});

document.addEventListener('DOMContentLoaded', () => {
  checkLockout();
  const isAuth = sessionStorage.getItem('krm_admin_auth') === 'true';
  const lastTime = parseInt(sessionStorage.getItem('krm_admin_login_time') || '0');
  
  if (isAuth && (Date.now() - lastTime) < SESSION_TIMEOUT_MS) {
    const overlay = document.getElementById('loginOverlay');
    const shell = document.getElementById('appShell');
    if (overlay) overlay.style.display = 'none';
    if (shell) shell.style.display = 'flex';
    initDashboard();
    setupIdleTimeout();
  }
});

function initDashboard() {
  startOrdersListener();
  startReviewsListener();
  loadProductsSection();
  loadStockSection();
  loadSettingsSection();
  loadReviewShortsSection();
  startCouponsListener();
}

// ── NAV ────────────────────────────────────────────────────
function switchNav(viewId, el) {
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.view-section').forEach(v => {
    v.style.display = 'none';
    v.classList.remove('fade-in');
  });
  const sec = document.getElementById(viewId);
  sec.style.display = 'block';
  requestAnimationFrame(() => sec.classList.add('fade-in'));
  document.querySelector('.main-header-title').textContent = el.dataset.title || 'Dashboard';
  if (viewId === 'settingsView') {
    loadSettingsSection();
  }
  if (viewId === 'reviewShortsView') {
    loadReviewShortsSection();
  }
  if (viewId === 'stockView') {
    updateStockCounters();
  }
  if (viewId === 'couponsView') {
    renderCoupons();
  }
  if (viewId === 'referralsView') {
    renderAdminReferralsStats();
  }
  if (viewId === 'customersView') {
    renderCustomersSection();
  }
}

function renderAdminReferralsStats() {
  if (typeof ReferralsService === 'undefined') return;
  const list = ReferralsService.getAllReferrers();
  let totalReferrers = list.length;
  let totalOrders = 0;
  let totalCommissions = 0;
  let totalSavings = 0;

  list.forEach(u => {
    const c = u.referralsCount || 0;
    totalOrders += c;
    totalCommissions += (u.totalEarned || 0);
    totalSavings += (c * 20);
  });

  const elUsers = document.getElementById('admRefTotalUsers');
  const elOrders = document.getElementById('admRefTotalOrders');
  const elCash = document.getElementById('admRefTotalCash');
  const elSavings = document.getElementById('admRefTotalSavings');

  if (elUsers) elUsers.textContent = totalReferrers;
  if (elOrders) elOrders.textContent = totalOrders;
  if (elCash) elCash.textContent = `₹${totalCommissions.toLocaleString('en-IN')}`;
  if (elSavings) elSavings.textContent = `₹${totalSavings.toLocaleString('en-IN')}`;
}

// ── ORDERS ─────────────────────────────────────────────────
function isPendingStatus(status) {
  if (!status) return true;
  const s = String(status).trim().toLowerCase();
  return s === 'pending' || s === 'payment pending' || s === 'payment_pending' || s === 'failed';
}

function isPaidOrder(o) {
  if (!o) return false;
  const s = String(o.status || '').trim().toLowerCase();
  return s === 'paid';
}

// 🛡️ PERSISTENT PRINTED CACHE (localStorage):
// Prevents any already printed orders from EVER jumping back into "New Orders",
// even if a webhook or external update later touches Firestore!
function getPrintedOrderCache() {
  try {
    return new Set(JSON.parse(localStorage.getItem('krm_admin_printed_orders') || '[]'));
  } catch(e) { return new Set(); }
}

function markOrdersPrintedInCache(idList) {
  try {
    const cache = getPrintedOrderCache();
    idList.filter(Boolean).forEach(id => cache.add(String(id).trim()));
    localStorage.setItem('krm_admin_printed_orders', JSON.stringify(Array.from(cache)));
  } catch(e) {}
}

// ⏱️ RELIABLE TIMESTAMP EXTRACTOR (Strict Newest-First Ordering):
// Extracts exact epoch milliseconds from any order date format for perfect chronological sorting
function getOrderTimestamp(o) {
  if (!o) return 0;
  // 1. Firestore Timestamp instance
  if (o.createdAt && typeof o.createdAt.toDate === 'function') {
    return o.createdAt.toDate().getTime();
  }
  if (o.createdAt && typeof o.createdAt.toMillis === 'function') {
    return o.createdAt.toMillis();
  }
  if (o.createdAt && typeof o.createdAt.seconds === 'number') {
    return o.createdAt.seconds * 1000;
  }
  // 2. Direct ISO string or Date object in createdAt
  if (typeof o.createdAt === 'string') {
    const t = new Date(o.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  // 3. Numeric timestampMs
  if (o.timestampMs && !isNaN(Number(o.timestampMs))) {
    return Number(o.timestampMs);
  }
  // 4. paidAt timestamp / ISO string
  if (o.paidAt) {
    if (typeof o.paidAt.toDate === 'function') return o.paidAt.toDate().getTime();
    const t = new Date(o.paidAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  // 5. Epoch timestamp embedded in order ID (e.g. ORD-1731234567890)
  if (o.id && typeof o.id === 'string' && o.id.startsWith('ORD-')) {
    const digits = o.id.replace(/\D/g, '');
    if (digits.length >= 10) {
      const num = parseInt(digits.slice(0, 13), 10);
      if (!isNaN(num) && num > 1600000000000) return num;
    }
  }
  // 6. Parsed date + time strings (e.g. '10/11/2026' & '03:00 PM')
  if (o.date) {
    try {
      const parts = String(o.date).split(/[\/\-]/);
      if (parts.length === 3) {
        const d = parts[0].length === 4 ? new Date(o.date) : new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(d.getTime())) return d.getTime();
      }
    } catch(e) {}
  }
  return 0;
}

function startOrdersListener() {
  const tbodyNew = document.getElementById('ordersVTableNew');
  const tbodyPrinted = document.getElementById('ordersVTablePrinted');
  if (tbodyNew) tbodyNew.innerHTML = `<tr><td colspan="7" class="loading-cell"><div class="spinner"></div> Loading orders…</td></tr>`;
  if (tbodyPrinted) tbodyPrinted.innerHTML = `<tr><td colspan="8" class="loading-cell"><div class="spinner"></div> Loading orders…</td></tr>`;
  unsubOrders = db.collection('orders').orderBy('createdAt', 'desc').onSnapshot(snap => {
    const rawList = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    const printedCache = getPrintedOrderCache();

    // Safeguard Deduplication & Merging:
    // Any documents sharing razorpayOrderId, razorpayPaymentId, id, or firestoreId belong to the same customer order!
    const orderMap = new Map();
    for (const ord of rawList) {
      // 1. Check if this order or any of its keys were previously printed and locked in cache
      const isCachedPrinted = printedCache.has(String(ord.firestoreId)) ||
                             (ord.id && printedCache.has(String(ord.id))) ||
                             (ord.razorpayOrderId && printedCache.has(String(ord.razorpayOrderId))) ||
                             (ord.razorpayPaymentId && printedCache.has(String(ord.razorpayPaymentId)));

      if (isCachedPrinted) {
        ord.isPrinted = true;
      }

      // 2. Find if this order matches an existing entry by razorpayOrderId, id, firestoreId, paymentId, or customer details
      let matchKey = null;
      for (const [k, existing] of orderMap.entries()) {
        const sameRzp = ord.razorpayOrderId && existing.razorpayOrderId && ord.razorpayOrderId === existing.razorpayOrderId;
        const sameId = ord.id && existing.id && ord.id === existing.id;
        const sameDoc = ord.firestoreId && (ord.firestoreId === existing.firestoreId || (existing.allFirestoreIds && existing.allFirestoreIds.includes(ord.firestoreId)));
        const crossDocRzp = (ord.firestoreId && existing.razorpayOrderId && ord.firestoreId === existing.razorpayOrderId) ||
                            (ord.razorpayOrderId && existing.firestoreId && ord.razorpayOrderId === existing.firestoreId);
        const samePayment = ord.razorpayPaymentId && existing.razorpayPaymentId && ord.razorpayPaymentId === existing.razorpayPaymentId;
        const sameCustOrder = ord.number && existing.number && ord.number === existing.number &&
                              ord.date && existing.date && ord.date === existing.date &&
                              ord.totalCost && existing.totalCost && ord.totalCost === existing.totalCost;

        if (sameRzp || sameId || sameDoc || crossDocRzp || samePayment || sameCustOrder) {
          matchKey = k;
          break;
        }
      }

      if (!matchKey) {
        ord.allFirestoreIds = [ord.firestoreId];
        const primaryKey = ord.razorpayOrderId || ord.id || ord.firestoreId;
        orderMap.set(primaryKey, ord);
      } else {
        const existing = orderMap.get(matchKey);
        if (!existing.allFirestoreIds) existing.allFirestoreIds = [existing.firestoreId];
        if (!existing.allFirestoreIds.includes(ord.firestoreId)) {
          existing.allFirestoreIds.push(ord.firestoreId);
        }

        // CRITICAL FIX: If ANY copy was printed, the order IS PRINTED! Never revert to unprinted!
        if (ord.isPrinted === true || existing.isPrinted === true || isCachedPrinted) {
          existing.isPrinted = true;
        }

        // If ANY copy has a tracking ID, preserve it!
        if (ord.trackingId && !existing.trackingId) {
          existing.trackingId = ord.trackingId;
        }

        // Prefer entry with complete items
        const existingHasItems = Array.isArray(existing.items) && existing.items.length > 0;
        const currentHasItems = Array.isArray(ord.items) && ord.items.length > 0;
        if (!existingHasItems && currentHasItems) {
          existing.items = ord.items;
          existing.totalCost = ord.totalCost || existing.totalCost;
        }

        // Prefer complete customer details
        if (!existing.firstName && ord.firstName) existing.firstName = ord.firstName;
        if (!existing.number && ord.number) existing.number = ord.number;
        if (!existing.address1 && ord.address1) existing.address1 = ord.address1;
        if (!existing.deliveryBy && ord.deliveryBy) existing.deliveryBy = ord.deliveryBy;
        if (!existing.couponCode && ord.couponCode) existing.couponCode = ord.couponCode;
        if (!existing.razorpayOrderId && ord.razorpayOrderId) existing.razorpayOrderId = ord.razorpayOrderId;
        if (!existing.razorpayPaymentId && ord.razorpayPaymentId) existing.razorpayPaymentId = ord.razorpayPaymentId;

        // Status: Paid takes precedence over Pending
        if (ord.status === 'Paid' || ord.status === 'paid') {
          existing.status = 'Paid';
        }
      }
    }
    _allOrders = Array.from(orderMap.values());
    // ⬇️ Chronological sort: Newest orders first at the top, older orders below
    _allOrders.sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
    renderOrders();
    updateStockCounters();
    updateCustomerAnalytics();
  }, err => {
    if (tbodyNew) tbodyNew.innerHTML = `<tr><td colspan="7" class="empty-cell">❌ Firestore error — check rules.</td></tr>`;
    if (tbodyPrinted) tbodyPrinted.innerHTML = `<tr><td colspan="8" class="empty-cell">❌ Firestore error — check rules.</td></tr>`;
  });
}

window._filteredNewOrders = []; // Global to hold current view's new orders for PDF

// Robust helper to match an order against a search query (Order ID, Name, Phone, Email, Tracking ID)
function matchesOrder(o, query) {
  if (!query) return true;
  const q = String(query).trim().toLowerCase();
  if (!q) return true;

  // Clean leading '#' (e.g. #ORD-123 or #123)
  const qNoHash = q.startsWith('#') ? q.replace(/^#+/, '').trim() : q;

  // 1. Match Order ID / Firestore Document ID / Razorpay Order & Payment IDs
  const orderIds = [
    o.id,
    o.firestoreId,
    o.razorpayOrderId,
    o.razorpayPaymentId,
    o.paymentDetails && o.paymentDetails.orderId,
    o.paymentDetails && o.paymentDetails.paymentId
  ].filter(Boolean).map(v => String(v).toLowerCase());

  if (orderIds.some(id => id.includes(q) || (qNoHash && id.includes(qNoHash)))) return true;

  // 2. Match Customer Name (firstName, lastName, name, customerName, etc.)
  const fullName = [
    o.firstName,
    o.lastName,
    o.name,
    o.customerName,
    o.paymentDetails && o.paymentDetails.name
  ].filter(Boolean).join(' ').toLowerCase();

  if (fullName.includes(q) || (qNoHash && fullName.includes(qNoHash))) return true;

  // Match multiple words in name (e.g. "Rajesh Kumar")
  const qWords = q.split(/\s+/).filter(Boolean);
  if (qWords.length > 1 && qWords.every(w => fullName.includes(w))) return true;

  // 3. Match Phone / Mobile Number
  const phoneList = [
    o.number,
    o.phone,
    o.mobileNumber,
    o.mobile,
    o.contact,
    o.paymentDetails && o.paymentDetails.contact
  ].filter(Boolean).map(v => String(v).trim());

  if (phoneList.some(p => p.toLowerCase().includes(q))) return true;

  // Normalized digit matching (handles +91, 0 prefix, spaces, dashes)
  const qDigits = q.replace(/\D/g, '');
  if (qDigits.length >= 3) {
    for (const p of phoneList) {
      const pDigits = p.replace(/\D/g, '');
      if (pDigits.includes(qDigits)) return true;
      if (pDigits.length >= 7 && qDigits.includes(pDigits)) return true;

      const p10 = (pDigits.length === 12 && pDigits.startsWith('91')) ? pDigits.slice(2) : (pDigits.length === 11 && pDigits.startsWith('0') ? pDigits.slice(1) : pDigits);
      const q10 = (qDigits.length === 12 && qDigits.startsWith('91')) ? qDigits.slice(2) : (qDigits.length === 11 && qDigits.startsWith('0') ? qDigits.slice(1) : qDigits);
      if (p10 && q10 && (p10.includes(q10) || q10.includes(p10))) return true;
    }
  }

  // 4. Match Email
  const email = String(o.email || o.emailAddress || (o.paymentDetails && o.paymentDetails.email) || '').toLowerCase();
  if (email && email.includes(q)) return true;

  // 5. Match Tracking ID
  const tracking = String(o.trackingId || '').toLowerCase();
  if (tracking && (tracking.includes(q) || (qNoHash && tracking.includes(qNoHash)))) return true;

  // 6. Match Address / District / Pincode
  const pincode = String(o.pincode || '').toLowerCase();
  if (pincode && pincode.includes(q)) return true;
  const district = String(o.district || '').toLowerCase();
  if (district && district.includes(q)) return true;

  return false;
}

function renderOrders() {
  const tbodyNew = document.getElementById('ordersVTableNew');
  const tbodyPrinted = document.getElementById('ordersVTablePrinted');
  const tiContainer = document.getElementById('tiPendingContainer');
  
  // Helper to filter a list by search query and date range
  const filterList = (list, qId, fromId, toId) => {
    let res = list;
    const qVal = (document.getElementById(qId)?.value || '').trim();
    if (qVal) {
      res = res.filter(o => matchesOrder(o, qVal));
    }
    
    const fromStr = document.getElementById(fromId)?.value;
    const toStr = document.getElementById(toId)?.value;
    
    if (fromStr || toStr) {
      const fromTime = fromStr ? new Date(fromStr).getTime() : 0;
      const toTime = toStr ? new Date(toStr).getTime() : Infinity;
      
      res = res.filter(o => {
        let orderTime = o.timestampMs || (o.createdAt && typeof o.createdAt.toDate === 'function' ? o.createdAt.toDate().getTime() : (o.createdAt ? new Date(o.createdAt).getTime() : 0));
        if (!orderTime) return true;
        
        if (fromStr && !toStr) {
          const selectedDateStr = fromStr.split('T')[0];
          const startOfDay = new Date(selectedDateStr + 'T00:00:00').getTime();
          const endOfDay = new Date(selectedDateStr + 'T23:59:59').getTime();
          return orderTime >= startOfDay && orderTime <= endOfDay;
        }
        
        return orderTime >= fromTime && orderTime <= toTime;
      });
    }
    return res;
  };

  const orderSearchQuery = (document.getElementById('orderSearch')?.value || '').trim();
  // When a search query is active in orderSearch, search across ALL orders so admin can find ANY order details!
  const baseNewList = orderSearchQuery
    ? _allOrders
    : _allOrders.filter(o => !o.isPrinted && isPaidOrder(o));

  const newOrders = filterList(baseNewList, 'orderSearch', 'filterFrom', 'filterTo');
  // ⬇️ Ensure newest orders are ALWAYS at the top of the table
  newOrders.sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
  window._filteredNewOrders = newOrders.filter(o => !o.isPrinted && isPaidOrder(o)); // Store only unprinted paid orders for PDF

  // Dynamic section title for visual feedback
  const ordersTitleEl = document.getElementById('ordersSectionTitle');
  if (ordersTitleEl) {
    if (orderSearchQuery) {
      ordersTitleEl.textContent = `🔍 Search Results for "${orderSearchQuery}" (${newOrders.length})`;
    } else {
      ordersTitleEl.textContent = '🆕 New / Unprinted Orders';
    }
  }

  // Check for previous pending orders (where customer may have paid) to show one-click recovery banner
  const oldPendingList = _allOrders.filter(o => !o.isPrinted && isPendingStatus(o.status));
  const banner = document.getElementById('pendingMigrationBanner');
  const countEl = document.getElementById('pendingOldCount');
  if (banner && countEl) {
    if (oldPendingList.length > 0 && !window._dismissPendingBanner) {
      countEl.textContent = oldPendingList.length;
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  }

  const tiPendingOrders = _allOrders.filter(o => o.isPrinted && !o.trackingId && o.status !== 'Cancelled');
  tiPendingOrders.sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
  
  const printedSearchQuery = (document.getElementById('printedSearch')?.value || '').trim();
  const basePrintedList = printedSearchQuery
    ? _allOrders.filter(o => o.isPrinted)
    : _allOrders.filter(o => o.isPrinted && (o.trackingId || o.status === 'Cancelled'));

  const printedOrders = filterList(basePrintedList, 'printedSearch', 'printedFilterFrom', 'printedFilterTo');
  printedOrders.sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));

  const printedTitleEl = document.getElementById('printedSectionTitle');
  if (printedTitleEl) {
    if (printedSearchQuery) {
      printedTitleEl.textContent = `🔍 Search Results for "${printedSearchQuery}" (${printedOrders.length})`;
    } else {
      printedTitleEl.textContent = '✅ Printed Orders';
    }
  }

  const renderRow = (o, sectionType) => {
    const statusClass = (o.status === 'Paid' || o.status === 'paid') ? 'badge-success' : o.status === 'Failed' ? 'badge-danger' : o.status === 'Cancelled' ? 'badge-cancel' : 'badge-warn';
    const items = (o.items||[]).map(i => `<div class="order-item"><span>${i.title}</span><span class="item-meta">×${i.quantity} — ₹${(i.price*i.quantity).toFixed(0)}</span></div>`).join('');
    const addr = [o.address1,o.address2,o.district,o.state,o.pincode].filter(Boolean).join(', ');
    const deliveryBy = o.deliveryBy || 'ST Courier';
    const isTpc = deliveryBy.toLowerCase().includes('professional');
    const badgeBg = isTpc ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)';
    const badgeColor = isTpc ? '#34d399' : '#a78bfa';
    const badgeBorder = isTpc ? 'rgba(16,185,129,0.35)' : 'rgba(99,102,241,0.35)';
    
    let checkboxHtml = '';
    let lastColHtml = '';

    if (sectionType === 'printed') {
      checkboxHtml = `<td><input type="checkbox" class="printed-order-cb" value="${o.firestoreId}"></td>`;
      lastColHtml = `<td>${o.trackingId ? `<span class="ti-badge">🚚 ${o.trackingId}</span>` : (o.status==='Cancelled' ? '<span class="ti-badge" style="background:rgba(239,68,68,0.1);color:#ef4444;border-color:rgba(239,68,68,0.3);">Cancelled</span>' : '<span class="ti-badge" style="background:rgba(245,158,11,0.1);color:#fbbf24;border-color:rgba(245,158,11,0.3);">Pending TI</span>')}</td>`;
    } else {
      lastColHtml = `<td>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <button class="btn-cancel-order" onclick="deleteSingleOrder('${o.firestoreId}', '${o.id}')" title="Delete Order">🗑️ Delete</button>
        </div>
      </td>`;
    }

    const couponBadge = o.couponCode ? `
      <div style="font-size:0.75rem; color:#34d399; margin-top:3px; display:inline-flex; align-items:center; gap:3px; background:rgba(16,185,129,0.1); padding:2px 6px; border-radius:4px; border:1px solid rgba(16,185,129,0.25);">
        🎟️ ${o.couponCode} (-₹${o.discountAmount || 0})
      </div>
    ` : '';

    let stageBadge = '';
    if (sectionType === 'new') {
      if (o.trackingId) {
        stageBadge = `<div style="font-size:0.75rem;color:#38bdf8;margin-top:3px;font-weight:700;">🚚 Shipped: ${o.trackingId}</div>`;
      } else if (o.isPrinted && o.status !== 'Cancelled') {
        stageBadge = `<div style="font-size:0.75rem;color:#fbbf24;margin-top:3px;font-weight:700;">📋 Printed (Pending TI)</div>`;
      } else if (!o.isPrinted && (o.status === 'Paid' || o.status === 'paid')) {
        stageBadge = `<div style="font-size:0.75rem;color:#34d399;margin-top:3px;font-weight:700;">🆕 New Order</div>`;
      }
    }

    const custName = o.firstName || o.name || o.customerName || (o.paymentDetails && o.paymentDetails.name) || 'Customer';
    const custPhone = o.number || o.phone || o.mobileNumber || o.mobile || o.contact || (o.paymentDetails && o.paymentDetails.contact) || '—';

    return `
    <tr>
      ${checkboxHtml}
      <td><div class="order-id">#${o.id}</div><div class="order-date">${o.day||''} ${o.date}</div><div class="order-time">🕐 ${o.time||''}</div></td>
      <td><div class="cust-name">${custName}</div><div class="cust-phone">📞 ${custPhone}</div><div class="cust-addr">📍 ${addr}</div></td>
      <td><span class="badge" style="background:${badgeBg};color:${badgeColor};border:1px solid ${badgeBorder};font-size:0.8rem;white-space:nowrap;font-weight:700;">🚚 ${deliveryBy}</span></td>
      <td><div class="items-list">${items}</div></td>
      <td><div class="order-total">${o.totalCost||''}</div>${couponBadge}</td>
      <td><span class="badge ${statusClass}">${o.status||'Paid'}</span>${stageBadge}</td>
      ${lastColHtml}
    </tr>`;
  };

  if (tbodyNew) {
    tbodyNew.innerHTML = '';
    if (!newOrders.length) {
      const msg = orderSearchQuery 
        ? `No orders found matching "${orderSearchQuery}". Check Order ID, Phone, or Name.`
        : 'No new paid orders found.';
      tbodyNew.innerHTML = `<tr><td colspan="7" class="empty-cell">${msg}</td></tr>`;
    } else {
      newOrders.forEach(o => tbodyNew.innerHTML += renderRow(o, 'new'));
    }
  }

  if (tbodyPrinted) {
    const cbAll = document.getElementById('selectAllPrinted');
    if (cbAll) cbAll.checked = false;
    tbodyPrinted.innerHTML = '';
    if (!printedOrders.length) {
      const msg = printedSearchQuery
        ? `No printed orders found matching "${printedSearchQuery}".`
        : 'No printed orders found.';
      tbodyPrinted.innerHTML = `<tr><td colspan="8" class="empty-cell">${msg}</td></tr>`;
    } else {
      printedOrders.forEach(o => tbodyPrinted.innerHTML += renderRow(o, 'printed'));
    }
  }

  if(tiContainer) {
    tiContainer.innerHTML = '';
    if (!tiPendingOrders.length) {
      tiContainer.innerHTML = '<div class="ti-empty">No orders pending tracking ID.</div>';
    } else {
      tiPendingOrders.forEach(o => {
        const items = (o.items||[]).map(i => `${i.title} (x${i.quantity})`).join(', ');
        const addr = [o.address1,o.address2,o.district,o.state,o.pincode].filter(Boolean).join(', ');
        const deliveryBy = o.deliveryBy || 'ST Courier';
        const isTpc = deliveryBy.toLowerCase().includes('professional');
        tiContainer.innerHTML += `
        <div class="ti-order-card fade-in">
          <div class="ti-order-header">
            <div><div class="order-id">#${o.id}</div><div class="ti-order-meta">${o.day||''} ${o.date} | 🕐 ${o.time||''}</div></div>
            <div><span class="badge ${o.status === 'Paid' ? 'badge-success' : 'badge-warn'}">${o.status||'Pending'}</span></div>
          </div>
          <div class="ti-info-grid">
            <div><strong>Customer:</strong> ${o.firstName||''}<br><strong>Phone:</strong> ${o.number||''}<br><strong>Total:</strong> ${o.totalCost||''}<br><strong>Delivery By:</strong> <span style="color:${isTpc ? '#34d399' : '#a78bfa'};font-weight:800;">🚚 ${deliveryBy}</span></div>
            <div><strong>Address:</strong> ${addr}<br><strong>Items:</strong> ${items}</div>
          </div>
          <div class="ti-input-row">
            <input class="ti-input" id="ti-input-${o.firestoreId}" placeholder="Enter 11-Digit Tracking ID" maxlength="25" onkeypress="if(event.key==='Enter') saveTrackingId('${o.firestoreId}')">
            <button class="btn-send-ti" onclick="saveTrackingId('${o.firestoreId}')">Send & Complete 🚀</button>
          </div>
        </div>`;
      });
    }
  }
}

window.saveTrackingId = async function(firestoreId) {
  const input = document.getElementById(`ti-input-${firestoreId}`);
  if (!input) return;
  const val = input.value.trim();
  if (val.length < 5) {
    alert('Please enter a valid Tracking ID.');
    input.focus();
    return;
  }
  try {
    const ord = _allOrders.find(o => o.firestoreId === firestoreId || (o.allFirestoreIds && o.allFirestoreIds.includes(firestoreId)));
    const docIds = new Set(ord?.allFirestoreIds || [firestoreId]);
    const updatePromises = [];
    docIds.forEach(id => {
      updatePromises.push(db.collection('orders').doc(id).set({ trackingId: val, isPrinted: true }, { merge: true }));
    });
    if (ord?.id) {
      updatePromises.push(
        db.collection('orders').where('id', '==', ord.id).get().then(snap => {
          snap.forEach(d => d.ref.set({ trackingId: val, isPrinted: true }, { merge: true }));
        }).catch(() => {})
      );
    }
    if (ord?.razorpayOrderId) {
      updatePromises.push(
        db.collection('orders').where('razorpayOrderId', '==', ord.razorpayOrderId).get().then(snap => {
          snap.forEach(d => d.ref.set({ trackingId: val, isPrinted: true }, { merge: true }));
        }).catch(() => {})
      );
    }
    if (ord) {
      ord.trackingId = val;
      ord.isPrinted = true;
    }
    await Promise.all(updatePromises);
    renderOrders();
    showToast('Tracking ID Saved! Order completed ✓');
  } catch (err) {
    alert('Error saving Tracking ID: ' + err.message);
  }
};

window.toggleSelectAllPrinted = function(el) {
  document.querySelectorAll('.printed-order-cb').forEach(cb => cb.checked = el.checked);
};

window.deleteSingleOrder = async function(firestoreId, orderId) {
  if (!confirm(`Permanently delete order #${orderId}?`)) return;
  try {
    const ord = _allOrders.find(o => o.firestoreId === firestoreId || o.id === orderId);
    const docIds = new Set(ord?.allFirestoreIds || [firestoreId]);
    const deletePromises = [];
    docIds.forEach(id => {
      deletePromises.push(db.collection('orders').doc(id).delete());
    });

    if (ord && ord.razorpayOrderId) {
      deletePromises.push(
        db.collection('orders').where('razorpayOrderId', '==', ord.razorpayOrderId).get().then(snap => {
          snap.forEach(d => d.ref.delete());
        }).catch(e => console.warn('Duplicate clean err:', e))
      );
    }
    if (orderId) {
      deletePromises.push(
        db.collection('orders').where('id', '==', orderId).get().then(snap => {
          snap.forEach(d => d.ref.delete());
        }).catch(e => console.warn('Duplicate clean err:', e))
      );
    }

    // Instantly remove locally and re-render so UI updates immediately
    _allOrders = _allOrders.filter(o => o.firestoreId !== firestoreId && o.id !== orderId);
    renderOrders();

    await Promise.all(deletePromises);
    showToast('Order deleted successfully ✓');
  } catch(err) {
    alert('Error deleting order: ' + err.message);
  }
};

window.dismissPendingBanner = function() {
  window._dismissPendingBanner = true;
  const banner = document.getElementById('pendingMigrationBanner');
  if (banner) banner.style.display = 'none';
};

window.moveAllPendingToNew = async function() {
  const pendingOrders = _allOrders.filter(o => !o.isPrinted && isPendingStatus(o.status));
  if (!pendingOrders.length) { showToast('No pending orders to move.'); return; }
  if (!confirm(`Are you sure you want to move all ${pendingOrders.length} pending order(s) to New Orders and mark as Paid?`)) return;

  showToast('Moving pending orders to New Orders...');
  try {
    await Promise.all(pendingOrders.map(o => db.collection('orders').doc(o.firestoreId).update({
      status: 'Paid',
      paymentMethod: 'Admin Migrated to Paid',
      movedToNewAt: firebase.firestore.FieldValue.serverTimestamp()
    })));
    showToast(`✅ ${pendingOrders.length} order(s) moved to New Orders!`);
    const banner = document.getElementById('pendingMigrationBanner');
    if (banner) banner.style.display = 'none';
  } catch(err) {
    alert('Error moving orders: ' + err.message);
  }
};

async function cancelOrder(firestoreId, orderId) {
  if (!confirm(`Cancel order #${orderId}? Stock will be restored.`)) return;
  try {
    await db.collection('orders').doc(firestoreId).update({ status: 'Cancelled' });
    showToast('Order cancelled & stock restored ✓');
  } catch(err) { alert('Error: ' + err.message); }
}

// ── PDF GENERATION (jsPDF) ─────────────────────────────────
// jsPDF uses standard fonts (Helvetica) which only support Latin-1 (ISO 8859-1).
// Unicode chars like ₹ corrupt the entire text string — sanitize first.
function _pdf(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#8377;/g, 'Rs.').replace(/&#x20B9;/g, 'Rs.')
    .replace(/\u20B9/g, 'Rs.')   // ₹  rupee symbol → Rs.
    .replace(/[^\x00-\xFF]/g, ''); // strip remaining non-Latin1
}

function downloadOrdersPdf(ordersToPrint, filename) {
  if (typeof window.jspdf === 'undefined') {
    showToast('⏳ PDF library loading, please try again in 2 seconds...');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const pageW = 210;
  const margin = 8;
  const gutter = 3;
  const labelW = pageW - margin * 2;
  // 5 labels per A4 page
  const labelH = (297 - margin * 2 - gutter * 4) / 5;
  const fromW = labelW * 0.34;
  const toX = margin + fromW + 4;

  let yPos = margin;

  ordersToPrint.forEach((o, idx) => {
    if (idx > 0 && idx % 5 === 0) {
      doc.addPage();
      yPos = margin;
    }

    const addr = [o.address1, o.address2, o.district, o.state, o.pincode].filter(Boolean).join(', ');
    const items = (o.items || []).map(i => `${i.title} (x${i.quantity})`).join(', ');
    const lBottom = yPos + labelH;

    // Outer border
    doc.setDrawColor(0);
    doc.setLineWidth(0.6);
    doc.rect(margin, yPos, labelW, labelH);

    // Vertical divider
    doc.setLineWidth(0.4);
    doc.line(margin + fromW, yPos, margin + fromW, lBottom);

    // ── FROM section ──
    let fy = yPos + 8;
    doc.setFontSize(15); doc.setFont('helvetica', 'bold');
    doc.text('FROM,', margin + 3, fy);
    fy += 7.5;
    doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text('KRM Brite', margin + 3, fy);
    fy += 8;
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    const fromLines = ['73, Amman koil Street,', 'v.Kattupalayam,', 'sathankuppam post,', 'Cuddalore - 607004'];
    fromLines.forEach(line => { doc.text(line, margin + 3, fy); fy += 6; });
    fy += 2;
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('Ph: 7094328711', margin + 3, fy);

    // ── TO section ──
    let ty = yPos + 8;
    doc.setFontSize(15); doc.setFont('helvetica', 'bold');
    doc.text('TO,', toX + 1.5, ty);

    // ── COURIER PARTNER BADGE (TOP RIGHT - BOLD & CLEAR) ──
    const deliveryPartner = (_pdf(o.deliveryBy) || 'ST Courier').trim();
    const courierBadgeText = `COURIER: ${deliveryPartner.toUpperCase()}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const badgeTextW = doc.getTextWidth(courierBadgeText);
    const badgePadX = 3;
    const badgeW = badgeTextW + (badgePadX * 2);
    const badgeH = 7;
    const badgeX = margin + labelW - badgeW - 2.5;
    const badgeY = yPos + 2.5;

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.setFillColor(240, 243, 248);
    doc.rect(badgeX, badgeY, badgeW, badgeH, 'FD');
    doc.setTextColor(0, 0, 0);
    doc.text(courierBadgeText, badgeX + badgePadX, badgeY + 5.1);

    ty += 7.5;
    doc.setFontSize(19); doc.setFont('helvetica', 'bold');
    doc.text(_pdf(o.firstName) || '', toX + 1.5, ty);
    ty += 7;
    doc.setFontSize(13.5); doc.setFont('helvetica', 'bold');
    doc.text(`Ph: ${_pdf(o.number)}`, toX + 1.5, ty); ty += 6;

    const addrLines = doc.splitTextToSize(_pdf(addr), labelW - fromW - 8);
    addrLines.slice(0, 3).forEach(line => { doc.text(line, toX + 1.5, ty); ty += 5.5; }); // Max 3 lines to fit larger fonts

    ty += 1.5;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13.5);
    const totalStr = _pdf(o.totalCost || '').replace(/^Rs\.?\s*/, ''); // strip leading Rs. to re-add cleanly
    doc.text(`Order #${_pdf(o.id)}  |  Total: Rs.${totalStr}  |  ${deliveryPartner}`, toX + 1.5, ty);
    ty += 6;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    const safeItems = _pdf(items);
    const itemLines = doc.splitTextToSize(`Items: ${safeItems}`, labelW - fromW - 8);
    itemLines.slice(0, 2).forEach(line => { doc.text(line, toX + 1.5, ty); ty += 5.2; });

    yPos += labelH + gutter;
  });

  const date = new Date().toLocaleDateString('en-IN').replace(/\//g, '-');
  doc.save(filename || `KRM-Brite-Orders-${date}.pdf`);
}

window.printNewOrders = async function() {
  const newOrders = window._filteredNewOrders.filter(o => !o.isPrinted && isPaidOrder(o));
  if (!newOrders.length) { alert('No new paid orders in the current filter view to download!'); return; }

  showToast('⬇️ Generating PDF...');
  downloadOrdersPdf(newOrders, `KRM-New-Orders-${new Date().toLocaleDateString('en-IN').replace(/\//g,'-')}.pdf`);

  showToast('Moving orders to Printed section...');
  try {
    const updatePromises = [];
    const printedIdsToCache = [];
    for (const ord of newOrders) {
      ord.isPrinted = true; // Instantly mark locally so it leaves New Orders immediately
      if (ord.firestoreId) printedIdsToCache.push(ord.firestoreId);
      if (ord.id) printedIdsToCache.push(ord.id);
      if (ord.razorpayOrderId) printedIdsToCache.push(ord.razorpayOrderId);
      if (ord.razorpayPaymentId) printedIdsToCache.push(ord.razorpayPaymentId);
      if (Array.isArray(ord.allFirestoreIds)) printedIdsToCache.push(...ord.allFirestoreIds);

      const docIds = new Set(ord.allFirestoreIds || [ord.firestoreId]);
      docIds.forEach(id => {
        updatePromises.push(
          db.collection('orders').doc(id).set({ isPrinted: true }, { merge: true })
            .catch(e => console.warn('Could not update doc', id, e))
        );
      });

      // Also ensure any matching documents by id or razorpayOrderId in Firestore get isPrinted: true
      if (ord.id) {
        updatePromises.push(
          db.collection('orders').where('id', '==', ord.id).get().then(snap => {
            snap.forEach(d => d.ref.set({ isPrinted: true }, { merge: true }));
          }).catch(() => {})
        );
      }
      if (ord.razorpayOrderId) {
        updatePromises.push(
          db.collection('orders').where('razorpayOrderId', '==', ord.razorpayOrderId).get().then(snap => {
            snap.forEach(d => d.ref.set({ isPrinted: true }, { merge: true }));
          }).catch(() => {})
        );
      }
    }

    // 🔒 Lock printed order IDs into persistent localStorage cache
    markOrdersPrintedInCache(printedIdsToCache);

    renderOrders(); // Instant re-render so table updates immediately!
    await Promise.all(updatePromises);
    showToast('✅ PDF downloaded & orders moved to Tracking Pending!');
  } catch(err) {
    alert('Error updating orders: ' + err.message);
  }
};

window.moveCancelledOrders = async function() {
  const cancelledOrders = _allOrders.filter(o => !o.isPrinted && o.status === 'Cancelled');
  if (!cancelledOrders.length) { showToast('No cancelled orders to move.'); return; }
  if (!confirm(`Move ${cancelledOrders.length} cancelled orders to Printed section?`)) return;
  showToast('Moving cancelled orders...');
  try {
    const updatePromises = [];
    const idsToCache = [];
    cancelledOrders.forEach(ord => {
      ord.isPrinted = true;
      if (ord.firestoreId) idsToCache.push(ord.firestoreId);
      if (ord.id) idsToCache.push(ord.id);
      if (ord.razorpayOrderId) idsToCache.push(ord.razorpayOrderId);
      if (Array.isArray(ord.allFirestoreIds)) idsToCache.push(...ord.allFirestoreIds);

      const ids = ord.allFirestoreIds || [ord.firestoreId];
      ids.forEach(id => updatePromises.push(db.collection('orders').doc(id).set({ isPrinted: true }, { merge: true })));
    });
    markOrdersPrintedInCache(idsToCache);
    renderOrders();
    await Promise.all(updatePromises);
    showToast('Cancelled orders moved successfully!');
  } catch(err) {
    alert('Error moving orders: ' + err.message);
  }
};

window.printSelectedOrders = function() {
  const selectedIds = Array.from(document.querySelectorAll('.printed-order-cb:checked')).map(cb => cb.value);
  if (!selectedIds.length) { alert('Select at least one order to download.'); return; }
  const ordersToPrint = _allOrders.filter(o => selectedIds.includes(o.firestoreId) && isPaidOrder(o));
  if (!ordersToPrint.length) { alert('No paid orders selected.'); return; }
  showToast('⬇️ Generating PDF...');
  downloadOrdersPdf(ordersToPrint, `KRM-Selected-Orders-${new Date().toLocaleDateString('en-IN').replace(/\//g,'-')}.pdf`);
};

window.deleteSelectedOrders = async function() {
  const selectedIds = Array.from(document.querySelectorAll('.printed-order-cb:checked')).map(cb => cb.value);
  if (!selectedIds.length) { alert('Select at least one order to delete.'); return; }
  
  if (!confirm(`Are you sure you want to PERMANENTLY delete ${selectedIds.length} selected order(s)? This action cannot be undone.`)) return;
  
  showToast("Deleting orders...");
  try {
    const deletePromises = [];
    selectedIds.forEach(id => {
      const ord = _allOrders.find(o => o.firestoreId === id);
      const allIds = ord?.allFirestoreIds || [id];
      allIds.forEach(docId => deletePromises.push(db.collection('orders').doc(docId).delete()));
      if (ord?.id) {
        deletePromises.push(db.collection('orders').where('id', '==', ord.id).get().then(s => s.forEach(d => d.ref.delete())).catch(() => {}));
      }
      if (ord?.razorpayOrderId) {
        deletePromises.push(db.collection('orders').where('razorpayOrderId', '==', ord.razorpayOrderId).get().then(s => s.forEach(d => d.ref.delete())).catch(() => {}));
      }
    });
    _allOrders = _allOrders.filter(o => !selectedIds.includes(o.firestoreId));
    renderOrders();
    await Promise.all(deletePromises);
    showToast("Orders deleted successfully!");
  } catch(err) {
    alert("Error deleting orders: " + err.message);
  }
};

// ── REVIEWS ────────────────────────────────────────────────
function startReviewsListener() {
  unsubReviews = db.collection('reviews').orderBy('createdAt','desc').onSnapshot(snap => {
    const all = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    renderAdminReviews(all);
  });
}

function renderAdminReviews(all) {
  const pC = document.getElementById('pendingContainer');
  const aC = document.getElementById('approvedContainer');
  const pending = all.filter(r => r.status === 'pending');
  const approved = all.filter(r => r.status === 'approved');
  pC.innerHTML = pending.length ? '' : '<div class="empty-cell">No pending reviews.</div>';
  aC.innerHTML = approved.length ? '' : '<div class="empty-cell">No approved reviews.</div>';
  pending.forEach((r, idx) => pC.insertAdjacentHTML('beforeend', genRevCard(r, true, idx)));
  approved.forEach((r, idx) => aC.insertAdjacentHTML('beforeend', genRevCard(r, false, idx)));
  document.getElementById('pendingCount').textContent = pending.length;
  document.getElementById('approvedCount').textContent = approved.length;
}

function genRevCard(rev, isPending, index = 0) {
  const src = (rev.productId && typeof storeData !== 'undefined')
    ? (storeData.products.find(p => p.id === rev.productId)?.title || rev.productId)
    : 'Global Review';
  const stars = '★'.repeat(rev.rating||5) + '☆'.repeat(5-(rev.rating||5));
  
  let photosHtml = '';
  if (rev.photos && rev.photos.length > 0) {
    photosHtml = `
    <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap; background:#0f172a; padding:8px; border-radius:8px; border:1px solid var(--border);">
      ${rev.photos.map(url => `<img src="${url}" style="width:60px; height:60px; object-fit:cover; border-radius:6px; cursor:pointer; border:1px solid var(--border); transition:0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="document.getElementById('adminLightboxImg').src='${url}'; document.getElementById('adminLightbox').style.display='flex';">`).join('')}
    </div>`;
  }

  return `<div class="review-card ${isPending?'rev-pending':'rev-approved'} slide-in-card" style="animation-delay: ${index * 0.08}s">
    <div class="rev-header">
      <div>
        <div class="rev-name">${rev.name||'Anonymous'}</div>
        <div class="rev-src">📦 ${src}</div>
      </div>
      <div class="rev-stars">${stars}</div>
    </div>
    <p class="rev-body">"${rev.body||''}"</p>
    ${photosHtml}
    <div class="rev-actions">
      ${isPending ? `<button class="btn-approve" onclick="approveReview('${rev.firestoreId}')">✅ Approve</button>` : ''}
      <button class="btn-del-rev" onclick="deleteReview('${rev.firestoreId}')">🗑 Delete</button>
    </div>
  </div>`;
}

window.approveReview = async id => {
  try { await db.collection('reviews').doc(id).update({ status: 'approved' }); showToast('Review approved ✓'); }
  catch(e) { alert('Error: '+e.message); }
};
window.deleteReview = async id => {
  if (!confirm('Delete this review permanently?')) return;
  try { await db.collection('reviews').doc(id).delete(); showToast('Review deleted'); }
  catch(e) { alert('Error: '+e.message); }
};

// ── PRODUCTS SECTION ───────────────────────────────────────
async function loadProductsSection() {
  try {
    const snap = await db.collection('productOverrides').get();
    snap.forEach(d => { productOverrides[d.id] = d.data(); });
  } catch(e) {}

  // Load admin-added products from Firestore
  try {
    const fsSnap = await db.collection('firestoreProducts').get();
    fsSnap.forEach(d => {
      const pid = d.id;
      const pData = { id: pid, ...d.data() };
      if (!storeData.products.find(p => p.id === pid)) {
        storeData.products.push(pData);
      }
      firestoreProductIds.add(pid);
      productOverrides[pid] = { ...pData, ...(productOverrides[pid] || {}) };
    });
  } catch(e) {}

  renderProductCards();
}

let activeProductFilter = 'all';

function updateProductFilterCounts() {
  const total = storeData.products.length;
  let vis = 0, hid = 0;
  storeData.products.forEach(p => {
    const ov = productOverrides[p.id] || {};
    const isHidden = (ov.hidden !== undefined) ? ov.hidden : (p.hidden || false);
    if (isHidden) hid++;
    else vis++;
  });
  const elAll = document.getElementById('cnt-p-all');
  const elVis = document.getElementById('cnt-p-visible');
  const elHid = document.getElementById('cnt-p-hidden');
  if (elAll) elAll.textContent = total;
  if (elVis) elVis.textContent = vis;
  if (elHid) elHid.textContent = hid;

  // Live sidebar counter showing balance visible products
  const navBadge = document.getElementById('navProductCount');
  if (navBadge) navBadge.textContent = vis;
}

window.filterProductsList = function(type, btn) {
  activeProductFilter = type;
  document.querySelectorAll('.prod-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderProductCards();
};

window.toggleProductVisibility = async function(pid, isVisible) {
  const isHidden = !isVisible;

  // Optimistic UI update
  const bar = document.getElementById(`vis-bar-${pid}`);
  const title = document.getElementById(`vis-title-${pid}`);
  const desc = document.getElementById(`vis-desc-${pid}`);
  const badge = document.getElementById(`vis-badge-${pid}`);
  const card = document.getElementById(`pc-${pid}`);

  if (bar) bar.className = `prod-visibility-bar ${isHidden ? 'is-hidden' : 'is-visible'}`;
  if (title) {
    title.className = `vis-label-title ${isHidden ? 'text-hidden' : 'text-visible'}`;
    title.textContent = isHidden ? '🚫 Hidden from Website' : '🟢 Visible on Website';
  }
  if (desc) {
    desc.textContent = isHidden 
      ? 'Customers cannot see or order this product on the website.' 
      : 'Live on website for customers to view and buy.';
  }
  if (badge) {
    badge.className = `vis-badge ${isHidden ? 'vis-badge-hidden' : 'vis-badge-visible'}`;
    badge.textContent = isHidden ? '🚫 Hidden' : '🟢 Visible';
  }
  if (card) {
    if (isHidden) card.classList.add('is-hidden-card');
    else card.classList.remove('is-hidden-card');
  }

  // Update in-memory state immediately
  productOverrides[pid] = { ...(productOverrides[pid] || {}), hidden: isHidden };
  const p = storeData.products.find(prod => prod.id === pid);
  if (p) p.hidden = isHidden;

  updateProductFilterCounts();

  // Also update Stock Manager so stock counters reflect only balance products
  if (typeof renderStockCards === 'function') renderStockCards();
  if (typeof updateStockCounters === 'function') updateStockCounters();

  // If in a filtered tab, remove or re-render smoothly
  if (activeProductFilter !== 'all') {
    setTimeout(() => renderProductCards(), 280);
  }

  // Persist to Firestore
  try {
    if (firestoreProductIds.has(pid)) {
      await db.collection('firestoreProducts').doc(pid).set({ hidden: isHidden }, { merge: true });
    } else {
      await db.collection('productOverrides').doc(pid).set({ hidden: isHidden }, { merge: true });
    }
    showToast(isHidden ? `🚫 "${p?.title || pid}" is now hidden from the website` : `🟢 "${p?.title || pid}" is now live on the website!`);
  } catch(e) {
    alert('Error updating visibility: ' + e.message);
  }
};

function renderProductCards() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  updateProductFilterCounts();

  const filteredProducts = storeData.products.filter(p => {
    const ov = productOverrides[p.id] || {};
    const isHidden = (ov.hidden !== undefined) ? ov.hidden : (p.hidden || false);
    if (activeProductFilter === 'visible') return !isHidden;
    if (activeProductFilter === 'hidden') return isHidden;
    return true;
  });

  if (filteredProducts.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; background: var(--card); border: 1px dashed var(--border); border-radius: var(--radius); color: var(--muted);">
        <div style="font-size: 2rem; margin-bottom: 10px;">🔍</div>
        <div style="font-size: 1rem; font-weight: 600; color: var(--text);">No products found in "${activeProductFilter}" view</div>
        <div style="font-size: 0.85rem; margin-top: 6px;">Switch to "All Products" to view all items.</div>
      </div>
    `;
    return;
  }

  filteredProducts.forEach((p, index) => {
    const ov = productOverrides[p.id] || {};
    const merged = { ...p, ...ov };
    const firstImg = (merged.images && merged.images[0]) || '';
    const isFsProduct = firestoreProductIds.has(p.id);
    const isHidden = (ov.hidden !== undefined) ? ov.hidden : (p.hidden || false);
    p.hidden = isHidden;

    const imagesData = merged.images || [];

    const thumbsHtml = imagesData.map((img, i) => `
      <div class="img-thumb-wrap">
        <img class="img-thumb" src="${img}" alt="img" onerror="this.style.opacity=.25">
        <button class="img-thumb-rm" onclick="removeImgRow('${p.id}',${i})" title="Remove">×</button>
      </div>`).join('');

    const urlRowsHtml = imagesData.map((img, i) => {
      const inputId = `imgurl-${p.id}-${i}`;
      const progressId = `imgprog-${p.id}-${i}`;
      const previewId = `imgprev-${p.id}-${i}`;
      return `
      <div class="img-url-row" id="imgrow-${p.id}-${i}" style="flex-direction:column;">
        <div style="display:flex;gap:6px;align-items:center;width:100%;">
          <img id="${previewId}" src="${img}" style="width:30px;height:30px;object-fit:cover;border-radius:4px;background:#000;flex-shrink:0;" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='">
          <input class="img-url-input" id="${inputId}" value="${img}" placeholder="Image URL..." oninput="document.getElementById('${previewId}').src=this.value">
          <button class="btn-pick-img" onclick="triggerFilePicker('${inputId}','${progressId}','${previewId}')" title="Pick image from device">📁 Pick</button>
          <button class="img-url-rm" onclick="removeImgRow('${p.id}',${i})">✕</button>
        </div>
        <div class="img-upload-progress" id="${progressId}"></div>
      </div>`;
    }).join('');

    grid.insertAdjacentHTML('beforeend', `
    <div class="prod-card slide-in-card ${isHidden ? 'is-hidden-card' : ''}" style="animation-delay:${index*0.06}s" id="pc-${p.id}">
      ${firstImg ? `<img class="prod-thumb" src="${firstImg}" onerror="this.style.display='none'">` : '<div class="prod-thumb" style="display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:.85rem;">No Image</div>'}
      <div class="prod-card-header">
        <div class="prod-badge-id">🔑 <code>${p.id}</code></div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          ${isFsProduct ? '<span class="new-prod-badge">✦ Admin Added</span>' : ''}
          <span class="vis-badge ${isHidden ? 'vis-badge-hidden' : 'vis-badge-visible'}" id="vis-badge-${p.id}">
            ${isHidden ? '🚫 Hidden' : '🟢 Visible'}
          </span>
        </div>
      </div>

      <!-- Visibility Toggle Bar -->
      <div class="prod-visibility-bar ${isHidden ? 'is-hidden' : 'is-visible'}" id="vis-bar-${p.id}">
        <div class="vis-text-group">
          <div class="vis-label-title ${isHidden ? 'text-hidden' : 'text-visible'}" id="vis-title-${p.id}">
            ${isHidden ? '🚫 Hidden from Website' : '🟢 Visible on Website'}
          </div>
          <div class="vis-label-sub" id="vis-desc-${p.id}">
            ${isHidden ? 'Customers cannot see or order this product on the website.' : 'Live on website for customers to view and buy.'}
          </div>
        </div>
        <label class="switch-control" title="Toggle product show/hide on website">
          <input type="checkbox" id="f-vis-${p.id}" ${isHidden ? '' : 'checked'} onchange="toggleProductVisibility('${p.id}', this.checked)">
          <span class="switch-slider"></span>
        </label>
      </div>

      <div class="prod-field">
        <label>Product Title</label>
        <input class="prod-input" id="f-title-${p.id}" value="${(merged.title||'').replace(/"/g,'&quot;')}">
      </div>
      <div class="prod-row">
        <div class="prod-field">
          <label>Price (₹)</label>
          <input class="prod-input" id="f-price-${p.id}" type="number" value="${merged.price||''}">
        </div>
        <div class="prod-field">
          <label>Compare Price (₹)</label>
          <input class="prod-input" id="f-compare-${p.id}" type="number" value="${merged.compareAtPrice||''}">
        </div>
      </div>
      <div class="prod-field">
        <label>Total Stock Limit</label>
        <input class="prod-input" id="f-stock-${p.id}" type="number" value="${stockData[p.id]?.total||0}" style="font-weight:700; color:var(--accent);">
      </div>
      <div class="prod-field">
        <label>Description</label>
        <textarea class="prod-input prod-textarea" id="f-desc-${p.id}">${merged.description||''}</textarea>
      </div>
      <div class="prod-field">
        <label>Bought Text</label>
        <input class="prod-input" id="f-bought-${p.id}" value="${(merged.boughtText||'').replace(/"/g,'&quot;')}">
      </div>
      <div class="prod-field">
        <label>Product Video URL (YouTube)</label>
        <input class="prod-input" id="f-video-${p.id}" value="${(merged.videoUrl||'').replace(/"/g,'&quot;')}">
      </div>
      <!-- Image Manager -->
      <div class="img-section">
        <div class="img-section-header">
          <span class="img-section-title">🖼 Images (${imagesData.length})</span>
          <button class="btn-save-imgs" onclick="saveProductImages('${p.id}')">💾 Save Images</button>
        </div>
        <div class="img-thumb-grid" id="imgThumbs-${p.id}">${thumbsHtml}</div>
        <div class="img-url-list" id="imgUrls-${p.id}">${urlRowsHtml}</div>
        <button class="btn-add-img" onclick="addImgRow('${p.id}')">+ Add Image URL</button>
      </div>
      <div class="prod-card-actions">
        <button class="btn-save-prod" onclick="saveProductCard('${p.id}')">💾 Save Changes</button>
        ${isFsProduct ? `<button class="btn-delete-prod" onclick="deleteFirestoreProduct('${p.id}')">🗑 Delete</button>` : ''}
      </div>
    </div>`);
  });
}

function removeImgRow(pid, idx) {
  const row = document.getElementById(`imgrow-${pid}-${idx}`);
  if (row) row.remove();
  const thumbGrid = document.getElementById(`imgThumbs-${pid}`);
  if (thumbGrid && thumbGrid.children[idx]) thumbGrid.children[idx].remove();
}

// ── IMAGE UPLOAD (BASE64 FIRESTORE BYPASS - HIGH COMPRESSION) ──────────────────────
async function uploadImageFile(file, onProgress) {
  if (onProgress) onProgress(10);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        if (onProgress) onProgress(50);
        const canvas = document.createElement('canvas');
        const maxSize = 1200; // High clarity max 1200px
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxSize) {
          height = Math.round(height * maxSize / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round(width * maxSize / height);
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        if (onProgress) onProgress(90);
        // High quality webp / jpeg for clear rendering
        const dataUrl = canvas.toDataURL('image/webp', 0.85) || canvas.toDataURL('image/jpeg', 0.85);
        if (onProgress) onProgress(100);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function triggerFilePicker(inputId, progressId, previewId) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  fileInput.click();
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) { fileInput.remove(); return; }
    
    // Show a local preview immediately while uploading
    if (previewId) {
      const reader = new FileReader();
      reader.onload = e => { document.getElementById(previewId).src = e.target.result; };
      reader.readAsDataURL(file);
    }
    
    const urlInput = document.getElementById(inputId);
    const progressEl = document.getElementById(progressId);
    if (progressEl) { progressEl.style.display = 'block'; progressEl.textContent = 'Uploading… 0%'; }
    try {
      const url = await uploadImageFile(file, pct => {
        if (progressEl) progressEl.textContent = `Uploading… ${pct}%`;
      });
      if (urlInput) {
        urlInput.value = url;
        if (previewId) document.getElementById(previewId).src = url; // Update with final URL
      }
      if (progressEl) { progressEl.textContent = '✓ Uploaded!'; setTimeout(() => { progressEl.style.display = 'none'; }, 2000); }
    } catch(e) {
      if (progressEl) { progressEl.textContent = '❌ Upload failed'; setTimeout(() => { progressEl.style.display = 'none'; }, 3000); }
      alert('Upload error (check Firebase Rules): ' + e.message);
    }
    fileInput.remove();
  });
}

function addImgRow(pid) {
  const list = document.getElementById(`imgUrls-${pid}`);
  const uid = Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  const inputId = `imgurl-new-${pid}-${uid}`;
  const progressId = `imgprog-${pid}-${uid}`;
  const previewId = `imgprev-${pid}-${uid}`;
  const row = document.createElement('div');
  row.className = 'img-url-row';
  row.style.flexDirection = 'column';
  row.innerHTML = `
    <div style="display:flex;gap:6px;align-items:center;width:100%;">
      <img id="${previewId}" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" style="width:30px;height:30px;object-fit:cover;border-radius:4px;background:#1e293b;flex-shrink:0;">
      <input class="img-url-input" id="${inputId}" placeholder="Paste URL or pick file →" oninput="document.getElementById('${previewId}').src=this.value">
      <button class="btn-pick-img" onclick="triggerFilePicker('${inputId}','${progressId}','${previewId}')" title="Pick image from device">📁 Pick</button>
      <button class="img-url-rm" onclick="this.closest('.img-url-row').remove()">✕</button>
    </div>
    <div class="img-upload-progress" id="${progressId}"></div>`;
  list.appendChild(row);
  row.querySelector('input').focus();
}

async function saveProductImages(pid) {
  const rows = document.querySelectorAll(`#imgUrls-${pid} .img-url-input`);
  const images = Array.from(rows).map(i => i.value.trim()).filter(url => url.length > 0);
  if (images.length === 0) { showToast('Add at least one image!'); return; }
  try {
    if (firestoreProductIds.has(pid)) {
      await db.collection('firestoreProducts').doc(pid).set({ images }, { merge: true });
    } else {
      await db.collection('productOverrides').doc(pid).set({ images }, { merge: true });
    }
    productOverrides[pid] = { ...(productOverrides[pid] || {}), images };
    const pIdx = storeData.products.findIndex(p => p.id === pid);
    if (pIdx >= 0) storeData.products[pIdx] = { ...storeData.products[pIdx], images };
    renderProductCards();
    showToast(`✓ ${images.length} image(s) saved!`);
  } catch(e) { alert('Error: ' + e.message); }
}

async function saveProductCard(pid) {
  const title = document.getElementById(`f-title-${pid}`)?.value.trim();
  const price = parseFloat(document.getElementById(`f-price-${pid}`)?.value) || 0;
  const compareAtPrice = parseFloat(document.getElementById(`f-compare-${pid}`)?.value) || 0;
  const description = document.getElementById(`f-desc-${pid}`)?.value.trim();
  const boughtText = document.getElementById(`f-bought-${pid}`)?.value.trim();
  const videoUrl = document.getElementById(`f-video-${pid}`)?.value.trim();
  const stockLimit = parseInt(document.getElementById(`f-stock-${pid}`)?.value) || 0;
  const isVisible = document.getElementById(`f-vis-${pid}`) ? document.getElementById(`f-vis-${pid}`).checked : true;
  const hidden = !isVisible;
  const data = { title, price, compareAtPrice, description, boughtText, videoUrl, hidden };

  // Update local memory immediately to prevent race conditions during snapshot updates
  productOverrides[pid] = { ...(productOverrides[pid] || {}), ...data };
  const pIdx = storeData.products.findIndex(p => p.id === pid);
  if (pIdx >= 0) storeData.products[pIdx] = { ...storeData.products[pIdx], ...data };
  stockData[pid] = { ...(stockData[pid]||{}), total: stockLimit };

  try {
    const promises = [
      db.collection('stock').doc(pid).set({ total: stockLimit }, { merge: true })
    ];
    if (firestoreProductIds.has(pid)) {
      promises.push(db.collection('firestoreProducts').doc(pid).set(data, { merge: true }));
    } else {
      promises.push(db.collection('productOverrides').doc(pid).set(data, { merge: true }));
    }
    await Promise.all(promises);

    updateProductFilterCounts();
    showToast(`✓ "${title}" saved!`);
  } catch(e) { alert('Error: ' + e.message); }
}

async function deleteFirestoreProduct(pid) {
  const p = storeData.products.find(p => p.id === pid);
  if (!confirm(`Delete "${p?.title || pid}" from the store? This cannot be undone.`)) return;
  try {
    await db.collection('firestoreProducts').doc(pid).delete();
    storeData.products = storeData.products.filter(p => p.id !== pid);
    firestoreProductIds.delete(pid);
    delete productOverrides[pid];
    renderProductCards();
    showToast('Product deleted ✓');
  } catch(e) { alert('Error: ' + e.message); }
}

// ── ADD PRODUCT MODAL ──────────────────────────────────────
function openAddProductModal() {
  ['np-title','np-id','np-price','np-compare','np-desc','np-bought','np-video','np-stock'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('np-sale').checked = true;
  if (document.getElementById('np-visible')) document.getElementById('np-visible').checked = true;
  const list = document.getElementById('np-images-list');
  list.innerHTML = '';
  addNpImageRow(); addNpImageRow();
  document.getElementById('addProductModal').classList.add('show');
}

function closeAddProductModal() {
  document.getElementById('addProductModal').classList.remove('show');
}

function autoSlugId() {
  const title = document.getElementById('np-title').value;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  document.getElementById('np-id').value = slug;
}

function addNpImageRow() {
  const list = document.getElementById('np-images-list');
  const uid = Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  const inputId = `np-img-${uid}`;
  const progressId = `np-prog-${uid}`;
  const previewId = `npprev-${uid}`;
  const row = document.createElement('div');
  row.className = 'img-url-row';
  row.style.flexDirection = 'column';
  row.innerHTML = `
    <div style="display:flex;gap:6px;align-items:center;width:100%;">
      <img id="${previewId}" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" style="width:30px;height:30px;object-fit:cover;border-radius:4px;background:#1e293b;flex-shrink:0;">
      <input class="img-url-input" id="${inputId}" placeholder="Paste URL or pick file →" oninput="document.getElementById('${previewId}').src=this.value">
      <button class="btn-pick-img" onclick="triggerFilePicker('${inputId}','${progressId}','${previewId}')" title="Pick image from device">📁 Pick</button>
      <button class="img-url-rm" onclick="this.closest('.img-url-row').remove()">✕</button>
    </div>
    <div class="img-upload-progress" id="${progressId}"></div>`;
  list.appendChild(row);
}

async function saveNewProduct() {
  const id = document.getElementById('np-id').value.trim();
  const title = document.getElementById('np-title').value.trim();
  const price = parseFloat(document.getElementById('np-price').value) || 0;
  const compareAtPrice = parseFloat(document.getElementById('np-compare').value) || 0;
  const description = document.getElementById('np-desc').value.trim();
  const boughtText = document.getElementById('np-bought').value.trim();
  const videoUrl = document.getElementById('np-video').value.trim();
  const sale = document.getElementById('np-sale').checked;
  const isVisible = document.getElementById('np-visible') ? document.getElementById('np-visible').checked : true;
  const hidden = !isVisible;
  const stockLimit = parseInt(document.getElementById('np-stock').value) || 0;
  const imgInputs = document.querySelectorAll('#np-images-list .img-url-input');
  const images = Array.from(imgInputs).map(i => i.value.trim()).filter(Boolean);

  if (!id || !title || !price) { alert('ID, Title and Price are required!'); return; }
  if (storeData.products.find(p => p.id === id)) {
    alert(`Product ID "${id}" already exists! Change the ID.`); return;
  }

  const productData = {
    id, title, price, compareAtPrice, description, boughtText, videoUrl,
    badges: sale ? ['Sale'] : [],
    images, rating: 0, reviewsCount: 0, aboutHtml: '',
    hidden
  };

  // Update local memory immediately to prevent race conditions during snapshot updates
  stockData[id] = { total: stockLimit, sold: 0 };
  if (!storeData.products.find(p => p.id === id)) {
    storeData.products.push(productData);
  }
  firestoreProductIds.add(id);
  productOverrides[id] = productData;

  try {
    await Promise.all([
      db.collection('firestoreProducts').doc(id).set(productData),
      db.collection('stock').doc(id).set({ total: stockLimit, sold: 0 }, { merge: true })
    ]);
    closeAddProductModal();
    renderProductCards();
    showToast(`✓ "${title}" added to store!`);
  } catch(e) { alert('Error: ' + e.message); }
}

// ── YOUTUBE & DELIVERY SETTINGS ───────────────────────────
let _deliveryOptions = ['ST Courier', 'The Professional Couriers'];

async function loadSettingsSection() {
  loadDeliveryOptionsSection();
  try {
    const doc = await db.collection('settings').doc('siteConfig').get();
    const defaultUrl = 'https://www.youtube-nocookie.com/embed/WrqSQzf2uIk?rel=0&modestbranding=1';
    let urlToUse = defaultUrl;
    if (doc.exists && doc.data().youtubeUrl) {
      urlToUse = doc.data().youtubeUrl.replace('WrqSQzf2ulk', 'WrqSQzf2uIk');
    }
    const ytInput = document.getElementById('ytUrlInput');
    if (ytInput) {
      ytInput.value = urlToUse;
      if (typeof updateYtPreview === 'function') updateYtPreview();
    }
  } catch(e) {}
}

async function loadDeliveryOptionsSection() {
  const container = document.getElementById('deliveryOptionsList');
  if (!container) return;
  try {
    const doc = await db.collection('settings').doc('deliveryConfig').get();
    if (doc.exists && Array.isArray(doc.data().options) && doc.data().options.length > 0) {
      _deliveryOptions = doc.data().options;
      if (!_deliveryOptions.includes('The Professional Couriers')) {
        _deliveryOptions.push('The Professional Couriers');
      }
      if (!_deliveryOptions.includes('ST Courier')) {
        _deliveryOptions.unshift('ST Courier');
      }
    } else {
      _deliveryOptions = ['ST Courier', 'The Professional Couriers'];
    }
  } catch(e) {
    console.warn('Error loading deliveryConfig:', e);
    _deliveryOptions = ['ST Courier', 'The Professional Couriers'];
  }
  renderDeliveryOptions();
}

function renderDeliveryOptions() {
  const container = document.getElementById('deliveryOptionsList');
  if (!container) return;
  if (!_deliveryOptions.length) {
    container.innerHTML = '<div style="color:var(--muted);font-size:.85rem;">No delivery options added yet.</div>';
    return;
  }
  container.innerHTML = _deliveryOptions.map((opt, i) => `
    <div style="display:flex;align-items:center;justify-content:space-between;background:#0f172a;padding:10px 14px;border-radius:8px;border:1px solid var(--border);">
      <span style="font-weight:600;font-size:0.9rem;color:var(--text);">🚚 ${opt} ${i === 0 ? '<span style="font-size:0.75rem;color:var(--accent);margin-left:6px;">(Default)</span>' : ''}</span>
      <button onclick="deleteDeliveryOption(${i})" style="padding:4px 10px;border-radius:6px;border:none;background:rgba(239,68,68,0.15);color:#fca5a5;font-weight:600;cursor:pointer;font-size:0.8rem;transition:.2s;" title="Remove Option">🗑 Delete</button>
    </div>
  `).join('');
}

window.addDeliveryOption = async function() {
  const input = document.getElementById('newDeliveryOptionInput');
  if (!input) return;
  const val = input.value.trim();
  if (!val) { alert('Please enter a delivery partner name.'); return; }
  if (_deliveryOptions.includes(val)) { alert('This delivery option already exists!'); return; }
  
  _deliveryOptions.push(val);
  try {
    await db.collection('settings').doc('deliveryConfig').set({ options: _deliveryOptions }, { merge: true });
    input.value = '';
    renderDeliveryOptions();
    showToast(`✓ Added "${val}" to delivery partners!`);
  } catch(e) {
    alert('Error saving delivery option: ' + e.message);
  }
};

window.deleteDeliveryOption = async function(idx) {
  const opt = _deliveryOptions[idx];
  if (_deliveryOptions.length <= 1) {
    alert('You must have at least one delivery option.');
    return;
  }
  if (!confirm(`Are you sure you want to remove "${opt}"?`)) return;
  _deliveryOptions.splice(idx, 1);
  try {
    await db.collection('settings').doc('deliveryConfig').set({ options: _deliveryOptions }, { merge: true });
    renderDeliveryOptions();
    showToast(`Removed "${opt}"`);
  } catch(e) {
    alert('Error removing option: ' + e.message);
  }
};

window.saveYoutubeUrl = async function() {
  const url = document.getElementById('ytUrlInput').value.trim();
  if (!url) { alert('Enter a valid YouTube URL.'); return; }
  
  const videoId = (typeof extractYoutubeId === 'function') ? extractYoutubeId(url) : null;
  
  if(!videoId) {
     alert('Invalid YouTube URL format. Please paste a valid link.');
     return;
  }
  
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
  
  try {
    await db.collection('settings').doc('siteConfig').set({ youtubeUrl: embedUrl }, { merge: true });
    document.getElementById('ytUrlInput').value = embedUrl;
    if (typeof updateYtPreview === 'function') updateYtPreview();
    showToast('YouTube URL saved ✓ — Live on site now!');
  } catch(e) { alert('Save error: '+e.message); }
};

// ── CUSTOMER REVIEW SHORTS VIDEO SETTINGS ─────────────────────
window.updateReviewShortsPreview = function() {
  const urlInput = document.getElementById('reviewShortsUrlInput');
  const iframe = document.getElementById('adminShortsIframe');
  const placeholder = document.getElementById('adminShortsPlaceholder');
  if (!urlInput || !iframe || !placeholder) return;

  const rawUrl = urlInput.value.trim();
  const videoId = (typeof extractYoutubeId === 'function') ? extractYoutubeId(rawUrl) : null;

  if (videoId) {
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
    iframe.style.display = 'block';
    placeholder.style.display = 'none';
  } else {
    iframe.src = '';
    iframe.style.display = 'none';
    placeholder.style.display = 'flex';
  }
};

window.saveReviewShorts = async function() {
  const urlInput = document.getElementById('reviewShortsUrlInput');
  const titleInput = document.getElementById('reviewShortsTitleInput');
  const enabledInput = document.getElementById('reviewShortsEnabled');
  const statusMsg = document.getElementById('reviewShortsStatusMsg');

  if (!urlInput) return;
  const rawUrl = urlInput.value.trim();

  if (!rawUrl) {
    alert('Please enter a YouTube Shorts or Video URL.');
    return;
  }

  const videoId = (typeof extractYoutubeId === 'function') ? extractYoutubeId(rawUrl) : null;
  if (!videoId) {
    alert('Invalid YouTube URL format. Please paste a valid YouTube Shorts, youtu.be, or video link.');
    return;
  }

  const isEnabled = enabledInput ? enabledInput.checked : true;
  const title = titleInput ? (titleInput.value.trim() || 'Customer Review') : 'Customer Review';

  const configObj = {
    reviewShortsUrl: rawUrl,
    reviewShortsVideoId: videoId,
    reviewShortsEnabled: isEnabled,
    reviewShortsTitle: title
  };

  try {
    await db.collection('settings').doc('siteConfig').set(configObj, { merge: true });
    try {
      localStorage.setItem('krm_review_shorts_config', JSON.stringify({
        url: rawUrl,
        videoId: videoId,
        enabled: isEnabled,
        title: title
      }));
    } catch(e) {}

    updateReviewShortsPreview();
    showToast('✓ Review Shorts video saved — Live on website now!');

    if (statusMsg) {
      statusMsg.style.display = 'block';
      statusMsg.style.color = '#34d399';
      statusMsg.textContent = '✓ Live on website above Customer Photos!';
      setTimeout(() => { if (statusMsg) statusMsg.style.display = 'none'; }, 4000);
    }
  } catch(err) {
    console.error('Error saving review shorts:', err);
    alert('Error saving to database: ' + err.message);
  }
};

window.clearReviewShorts = async function() {
  if (!confirm('Are you sure you want to remove the review video from the website?')) return;

  const urlInput = document.getElementById('reviewShortsUrlInput');
  const enabledInput = document.getElementById('reviewShortsEnabled');
  const iframe = document.getElementById('adminShortsIframe');
  const placeholder = document.getElementById('adminShortsPlaceholder');
  const statusMsg = document.getElementById('reviewShortsStatusMsg');

  if (urlInput) urlInput.value = '';
  if (enabledInput) enabledInput.checked = false;
  if (iframe) { iframe.src = ''; iframe.style.display = 'none'; }
  if (placeholder) placeholder.style.display = 'flex';

  try {
    await db.collection('settings').doc('siteConfig').set({
      reviewShortsUrl: '',
      reviewShortsVideoId: '',
      reviewShortsEnabled: false
    }, { merge: true });

    try {
      localStorage.removeItem('krm_review_shorts_config');
    } catch(e) {}

    showToast('Review video removed from website.');
    if (statusMsg) {
      statusMsg.style.display = 'block';
      statusMsg.style.color = '#fca5a5';
      statusMsg.textContent = 'Video removed from website.';
      setTimeout(() => { if (statusMsg) statusMsg.style.display = 'none'; }, 4000);
    }
  } catch(err) {
    alert('Error removing video: ' + err.message);
  }
};

async function loadReviewShortsSection() {
  try {
    const doc = await db.collection('settings').doc('siteConfig').get();
    if (doc.exists) {
      const data = doc.data();
      const urlInput = document.getElementById('reviewShortsUrlInput');
      const titleInput = document.getElementById('reviewShortsTitleInput');
      const enabledInput = document.getElementById('reviewShortsEnabled');

      if (urlInput && data.reviewShortsUrl) {
        urlInput.value = data.reviewShortsUrl;
      }
      if (titleInput && data.reviewShortsTitle) {
        titleInput.value = data.reviewShortsTitle;
      }
      if (enabledInput && data.reviewShortsEnabled !== undefined) {
        enabledInput.checked = (data.reviewShortsEnabled !== false);
      }
      updateReviewShortsPreview();
    }
  } catch(err) {
    console.warn('Error loading reviewShortsConfig:', err);
  }
}
window.loadReviewShortsSection = loadReviewShortsSection;

// ── STOCK MANAGER ──────────────────────────────────────────
async function loadStockSection() {
  try {
    const snap = await db.collection('stock').get();
    snap.forEach(d => { stockData[d.id] = d.data(); });
  } catch(e) {}
  renderStockCards();
  updateStockCounters();
}

let stockCharts = {};
let revChart = null, ordChart = null;

function renderStockCards() {
  const grid = document.getElementById('stockGrid');
  if (!grid) return;
  grid.innerHTML = '';

  // Only display balance (active/visible) products in the stock limits and counters
  const activeProducts = storeData.products.filter(p => {
    const ov = productOverrides[p.id] || {};
    return ov.hidden !== undefined ? !ov.hidden : !p.hidden;
  });

  if (activeProducts.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--muted); font-size: 0.95rem;">No active balance products found in store.</div>';
    return;
  }

  activeProducts.forEach((p, index) => {
    const s = stockData[p.id] || { total: 0 };
    grid.insertAdjacentHTML('beforeend', `
    <div class="stock-card slide-in-card" style="animation-delay: ${(index * 0.08) + 0.3}s" id="sc-${p.id}">
      <div class="stock-name">${p.title}</div>
      <div class="stock-row">
        <label>Total Limit</label>
        <div class="stock-input-wrap">
          <input type="number" class="stock-input" id="si-${p.id}" value="${s.total||0}" min="0">
          <button class="btn-save-stock" onclick="saveStock('${p.id}')">Update</button>
        </div>
      </div>
      <div class="stock-visuals">
        <div class="stock-chart-wrap"><canvas id="schart-${p.id}"></canvas></div>
        <div class="stock-counters" id="sct-${p.id}">
          <div class="stock-stat stat-blue"><div class="stat-lbl">Placed</div><div class="stat-val" id="ss-placed-${p.id}">—</div></div>
          <div class="stock-stat stat-red"><div class="stat-lbl">Cancelled</div><div class="stat-val" id="ss-cancelled-${p.id}">—</div></div>
          <div class="stock-stat stat-green"><div class="stat-lbl">Remain</div><div class="stat-val" id="ss-remain-${p.id}">—</div></div>
        </div>
      </div>
    </div>`);
  });
}

function initOrUpdateDashboardCharts() {
  if (typeof Chart === 'undefined') return; // Ensure Chart is loaded
  Chart.defaults.color = '#cbd5e1';
  Chart.defaults.font.family = 'Outfit';

  let totalRev = 0;
  const recentDays = {};
  for(let i=6; i>=0; i--) {
    let d = new Date(); d.setDate(d.getDate()-i);
    let key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    recentDays[key] = { rev: 0, orders: 0 };
  }

  _allOrders.forEach(o => {
    const isPaid = (o.status === 'Paid' || o.status === 'paid');
    if(isPaid) {
      const amt = parseFloat((o.totalCost||'').replace(/[^\d.]/g,'')) || 0;
      totalRev += amt;
    }
    
    let d;
    if (o.timestampMs) {
        d = new Date(o.timestampMs);
    } else if (o.date && o.date.includes('/')) {
        let parts = o.date.split('/');
        if (parts.length === 3) d = new Date(parts[2], parts[1]-1, parts[0]);
    } else if (o.date) {
        d = new Date(o.date);
    }

    if(d && !isNaN(d)) {
        let key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        if(recentDays[key]) {
           if(isPaid) {
              recentDays[key].orders++;
              recentDays[key].rev += (parseFloat((o.totalCost||'').replace(/[^\d.]/g,'')) || 0);
           }
        }
    }
  });

  document.getElementById('ovTotalRev').textContent = '₹' + totalRev.toLocaleString('en-IN');

  const labels = Object.keys(recentDays).map(d => d.slice(5));
  const revData = Object.values(recentDays).map(d => d.rev);
  const ordData = Object.values(recentDays).map(d => d.orders);

  if(!revChart) {
    const ctx = document.getElementById('revenueChart');
    if(ctx) {
      let gradient = ctx.getContext('2d').createLinearGradient(0,0,0,240);
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

      revChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Revenue (₹)', data: revData, borderColor: '#10b981', backgroundColor: gradient, fill: true, tension: 0.4 }] },
        options: { 
            animation: { duration: 2000, easing: 'easeOutQuart' },
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } }, 
            scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } 
        }
      });
    }
  } else {
    revChart.data.labels = labels; revChart.data.datasets[0].data = revData; revChart.update();
  }

  if(!ordChart) {
    const ctx = document.getElementById('ordersChart');
    if(ctx) {
      let gradient = ctx.getContext('2d').createLinearGradient(0,0,0,240);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

      ordChart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Orders', data: ordData, backgroundColor: gradient, borderColor: '#6366f1', borderWidth: 2, borderRadius: 6 }] },
        options: { 
            animation: { duration: 2000, easing: 'easeOutQuart', delay: (ctx) => ctx.dataIndex * 100 },
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } }, 
            scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { stepSize: 1 } }, x: { grid: { display: false } } } 
        }
      });
    }
  } else {
    ordChart.data.labels = labels; ordChart.data.datasets[0].data = ordData; ordChart.update();
  }
}

async function saveStock(pid) {
  const val = parseInt(document.getElementById('si-'+pid).value) || 0;
  try {
    await db.collection('stock').doc(pid).set({ total: val }, { merge: true });
    stockData[pid] = { ...(stockData[pid]||{}), total: val };
    updateStockCounters();
    showToast('Stock saved ✓');
  } catch(e) { alert('Error: '+e.message); }
}

function updateStockCounters() {
  if (typeof Chart === 'undefined') {
    setTimeout(updateStockCounters, 200); // Wait for Chart.js if not ready
    return;
  }
  
  const activeProducts = storeData.products.filter(p => {
    const ov = productOverrides[p.id] || {};
    return ov.hidden !== undefined ? !ov.hidden : !p.hidden;
  });

  activeProducts.forEach(p => {
    const total = stockData[p.id]?.total || 0;
    const placedQty = _allOrders.filter(o => (o.status === 'Paid' || o.status === 'paid')).reduce((acc,o) => {
      const item = (o.items||[]).find(i => i.id===p.id || i.productId===p.id || (i.title||'').toLowerCase().includes(p.title.substring(0,10).toLowerCase()));
      return acc + (item ? (item.quantity||1) : 0);
    }, 0);
    const cancelQty = _allOrders.filter(o => o.status === 'Cancelled').reduce((acc,o) => {
      const item = (o.items||[]).find(i => i.id===p.id || i.productId===p.id || (i.title||'').toLowerCase().includes(p.title.substring(0,10).toLowerCase()));
      return acc + (item ? (item.quantity||1) : 0);
    }, 0);
    const remaining = Math.max(0, total - placedQty);
    
    const pe = document.getElementById(`ss-placed-${p.id}`);
    const ce = document.getElementById(`ss-cancelled-${p.id}`);
    const re = document.getElementById(`ss-remain-${p.id}`);
    if (pe) pe.textContent = placedQty;
    if (ce) ce.textContent = cancelQty;
    if (re) re.textContent = remaining;

    const cvs = document.getElementById(`schart-${p.id}`);
    if(cvs) {
      if(!stockCharts[p.id]) {
        stockCharts[p.id] = new Chart(cvs, {
          type: 'doughnut',
          data: { labels: ['Placed', 'Cancelled', 'Remain'], datasets: [{ data: [placedQty, cancelQty, remaining], backgroundColor: ['#3b82f6', '#ef4444', '#10b981'], borderWidth: 0 }] },
          options: { 
              animation: { animateScale: true, animateRotate: true, duration: 1500, easing: 'easeOutBounce' },
              responsive: true, 
              maintainAspectRatio: false, 
              cutout: '75%', 
              plugins: { legend: { display: false }, tooltip: { enabled: true } } 
          }
        });
      } else {
        stockCharts[p.id].data.datasets[0].data = [placedQty, cancelQty, remaining];
        stockCharts[p.id].update();
      }

      // Sync the 'sold' and 'remaining' field to Firestore for public site
      // Using debounce-like check to avoid too many writes
      if (stockData[p.id]?.sold !== placedQty) {
          db.collection('stock').doc(p.id).set({ sold: placedQty, remaining: remaining }, { merge: true });
          stockData[p.id] = { ...stockData[p.id], sold: placedQty, remaining: remaining };
      }
    }
  });

  initOrUpdateDashboardCharts();
}

// ── TOAST ─────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// Disable main.js review functions on admin page
window.renderReviewSummary = () => {};
window.renderPublicReviews = () => {};
window.loadReviewsFromFirestore = () => {};

// ── COUPON CODES MANAGER ────────────────────────────────────
let unsubCoupons = null;
let _allCoupons = [];

function startCouponsListener() {
  const tbody = document.getElementById('couponsTableBody');
  if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="loading-cell"><div class="spinner"></div> Loading coupons…</td></tr>`;
  
  if (unsubCoupons) unsubCoupons();
  unsubCoupons = db.collection('coupons').onSnapshot(snap => {
    _allCoupons = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    _allCoupons.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
    renderCoupons();
  }, err => {
    console.error("Coupons listener error:", err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">❌ Error loading coupons.</td></tr>`;
  });
}

function renderCoupons() {
  const tbody = document.getElementById('couponsTableBody');
  const statTotal = document.getElementById('statTotalCoupons');
  const statActive = document.getElementById('statActiveCoupons');
  const statRedeemed = document.getElementById('statRedeemedCoupons');

  if (statTotal) statTotal.textContent = _allCoupons.length;
  if (statActive) statActive.textContent = _allCoupons.filter(c => c.status === 'active').length;
  if (statRedeemed) {
    const totalUses = _allCoupons.reduce((sum, c) => sum + (Number(c.usedCount) || 0), 0);
    statRedeemed.textContent = totalUses;
  }

  if (!tbody) return;

  if (_allCoupons.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">No coupons created yet. Click "+ Add Coupon" to create your first discount code.</td></tr>`;
    return;
  }

  tbody.innerHTML = _allCoupons.map(c => {
    const isActive = c.status === 'active';
    const statusBadge = isActive 
      ? `<span class="badge badge-success">Active</span>`
      : `<span class="badge badge-cancel">Disabled</span>`;
    
    const discountText = c.discountType === 'percentage' 
      ? `<span style="color:#34d399; font-weight:700; font-size:1rem;">${c.discountValue}% OFF</span>`
      : `<span style="color:#38bdf8; font-weight:700; font-size:1rem;">₹${c.discountValue} OFF</span>`;

    const minAmountText = (c.minOrderAmount && Number(c.minOrderAmount) > 0)
      ? `₹${c.minOrderAmount}`
      : `<span style="color:var(--muted); font-size:0.85rem;">None (₹0)</span>`;

    const usesText = `<span style="font-weight:600; color:#a78bfa;">${c.usedCount || 0}</span> times`;

    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <code style="background:#0f172a; border:1px solid rgba(99,102,241,0.3); color:#818cf8; padding:5px 10px; border-radius:6px; font-weight:800; font-size:0.95rem; letter-spacing:1px;">${c.code}</code>
            <button onclick="navigator.clipboard.writeText('${c.code}'); showToast('Copied ${c.code} to clipboard!');" title="Copy Code" style="background:none; border:none; color:var(--muted); cursor:pointer; font-size:0.9rem; padding:2px;">📋</button>
          </div>
          ${c.description ? `<div style="font-size:0.75rem; color:var(--muted); margin-top:4px;">${c.description}</div>` : ''}
        </td>
        <td>${discountText}</td>
        <td>${minAmountText}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            ${statusBadge}
            <button onclick="toggleCouponStatus('${c.firestoreId}', '${c.status}')" style="background:none; border:1px solid var(--border); color:var(--muted); border-radius:6px; padding:3px 8px; font-size:0.72rem; cursor:pointer;" title="Toggle Active/Disabled">
              ${isActive ? 'Disable' : 'Enable'}
            </button>
          </div>
        </td>
        <td>${usesText}</td>
        <td>
          <div style="display:flex; gap:6px; align-items:center;">
            <button class="btn-move-order" onclick="openEditCouponModal('${c.firestoreId}')" title="Edit Coupon">✏️ Edit</button>
            <button class="btn-cancel-order" onclick="deleteCoupon('${c.firestoreId}', '${c.code}')" title="Delete Coupon">🗑️ Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.openAddCouponModal = function() {
  document.getElementById('couponModalTitle').textContent = '➕ Create New Coupon';
  document.getElementById('couponEditId').value = '';
  const codeIn = document.getElementById('cpn-code');
  codeIn.value = '';
  codeIn.readOnly = false;
  document.getElementById('cpn-type').value = 'percentage';
  document.getElementById('cpn-value').value = '';
  document.getElementById('cpn-min').value = '0';
  document.getElementById('cpn-status').value = 'active';
  document.getElementById('cpn-desc').value = '';
  updateCouponInputHint();
  document.getElementById('couponModal').classList.add('show');
};

window.openEditCouponModal = function(id) {
  const c = _allCoupons.find(item => item.firestoreId === id);
  if (!c) return;
  document.getElementById('couponModalTitle').textContent = `✏️ Edit Coupon: ${c.code}`;
  document.getElementById('couponEditId').value = c.firestoreId;
  const codeIn = document.getElementById('cpn-code');
  codeIn.value = c.code;
  codeIn.readOnly = true;
  document.getElementById('cpn-type').value = c.discountType || 'percentage';
  document.getElementById('cpn-value').value = c.discountValue || '';
  document.getElementById('cpn-min').value = c.minOrderAmount || '0';
  document.getElementById('cpn-status').value = c.status || 'active';
  document.getElementById('cpn-desc').value = c.description || '';
  updateCouponInputHint();
  document.getElementById('couponModal').classList.add('show');
};

window.closeCouponModal = function() {
  document.getElementById('couponModal').classList.remove('show');
};

window.updateCouponInputHint = function() {
  const type = document.getElementById('cpn-type').value;
  const valLabel = document.getElementById('cpn-value-label');
  const valInput = document.getElementById('cpn-value');
  if (type === 'percentage') {
    valLabel.textContent = 'Discount Value (%) *';
    valInput.placeholder = 'e.g. 10 (for 10%)';
    valInput.max = '100';
  } else {
    valLabel.textContent = 'Discount Value (₹) *';
    valInput.placeholder = 'e.g. 50 (for ₹50 flat discount)';
    valInput.removeAttribute('max');
  }
};

window.saveCoupon = async function() {
  const editId = document.getElementById('couponEditId').value.trim();
  const rawCode = document.getElementById('cpn-code').value.trim().toUpperCase();
  const type = document.getElementById('cpn-type').value;
  const value = parseFloat(document.getElementById('cpn-value').value);
  const minOrder = parseFloat(document.getElementById('cpn-min').value) || 0;
  const status = document.getElementById('cpn-status').value;
  const desc = document.getElementById('cpn-desc').value.trim();

  if (!rawCode) {
    alert('Please enter a Coupon Code.');
    return;
  }

  if (isNaN(value) || value <= 0) {
    alert('Please enter a valid discount value greater than 0.');
    return;
  }

  if (type === 'percentage' && value > 100) {
    alert('Percentage discount cannot exceed 100%.');
    return;
  }

  const couponId = editId || rawCode;
  const couponData = {
    code: rawCode,
    discountType: type,
    discountValue: value,
    minOrderAmount: minOrder,
    status: status,
    description: desc,
    updatedAt: Date.now()
  };

  if (!editId) {
    couponData.createdAt = Date.now();
    couponData.usedCount = 0;
  }

  try {
    await db.collection('coupons').doc(couponId).set(couponData, { merge: true });
    closeCouponModal();
    showToast(`✓ Coupon "${rawCode}" saved successfully!`);
  } catch(err) {
    console.error("Error saving coupon:", err);
    alert('Error saving coupon: ' + err.message);
  }
};

window.deleteCoupon = async function(id, code) {
  if (!confirm(`Are you sure you want to delete coupon "${code || id}"?`)) return;
  try {
    await db.collection('coupons').doc(id).delete();
    showToast(`✓ Deleted coupon "${code || id}"`);
  } catch(err) {
    console.error("Error deleting coupon:", err);
    alert('Error deleting coupon: ' + err.message);
  }
};

window.toggleCouponStatus = async function(id, currentStatus) {
  const newStatus = (currentStatus === 'active') ? 'inactive' : 'active';
  try {
    await db.collection('coupons').doc(id).update({
      status: newStatus,
      updatedAt: Date.now()
    });
    showToast(`Coupon status updated to ${newStatus}`);
  } catch(err) {
    console.error("Error updating status:", err);
    alert('Error changing status: ' + err.message);
  }
};

// ============================================================
// CUSTOMER SEGMENTATION & ANALYTICS MODULE (1-TIME vs REPEAT vs SAMPLE BUYERS)
// ============================================================

let _customersList = [];
let _activeCustomerSegment = 'repeat';
let _currentlyRenderedCustomers = [];

// Helper: Normalize Indian phone number (extract last 10 digits)
function normalizeCustomerPhone(phone) {
  if (!phone) return '';
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length >= 10) {
    return clean.slice(-10);
  }
  return clean;
}

// Helper: Identify Sample / Trial product items reliably
function isSampleProductItem(item) {
  if (!item) return false;
  const id = String(item.id || item.productId || '').toLowerCase().trim();
  const title = String(item.title || item.name || '').toLowerCase().trim();
  return id === 'sample-product' || 
         id.includes('sample') || 
         id.includes('trail') || 
         id.includes('trial') || 
         title.includes('sample') || 
         title.includes('trail') || 
         title.includes('trial');
}

// Helper: Parse order total cost currency string to number
function parseOrderAmount(cost) {
  if (typeof cost === 'number') return cost;
  if (!cost) return 0;
  const num = parseFloat(String(cost).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
}

// Helper: Determine unique customer grouping key
function getCustomerKey(order) {
  const normPhone = normalizeCustomerPhone(order.number);
  if (normPhone && normPhone.length === 10) return normPhone;
  if (order.email && order.email.includes('@')) return order.email.trim().toLowerCase();
  if (order.userId && order.userId !== 'guest') return order.userId;
  const namePart = (order.firstName || '').trim().toLowerCase();
  const pinPart = (order.pincode || '').trim();
  if (namePart) return `${namePart}_${pinPart}`;
  return 'cust_' + (order.id || order.firestoreId || Math.random().toString());
}

// Group orders into comprehensive Customer profiles
function processCustomersData() {
  const customerMap = new Map();

  // Filter for confirmed/non-cancelled orders
  const validOrders = _allOrders.filter(o => {
    if (!o) return false;
    const st = String(o.status || '').toLowerCase().trim();
    return st !== 'cancelled' && st !== 'failed';
  });

  validOrders.forEach(o => {
    const key = getCustomerKey(o);
    const normPhone = normalizeCustomerPhone(o.number);
    const orderCost = parseOrderAmount(o.totalCost);

    let orderTimeMs = 0;
    if (o.createdAt && typeof o.createdAt.toDate === 'function') {
      orderTimeMs = o.createdAt.toDate().getTime();
    } else if (o.timestampMs) {
      orderTimeMs = Number(o.timestampMs);
    } else if (o.date) {
      const parsed = new Date(o.date).getTime();
      if (!isNaN(parsed)) orderTimeMs = parsed;
    }

    if (!customerMap.has(key)) {
      customerMap.set(key, {
        key: key,
        name: o.firstName || 'Customer',
        phone: normPhone || o.number || '',
        rawPhone: o.number || '',
        email: o.email || '',
        address: [o.address1, o.address2, o.district, o.state, o.pincode].filter(Boolean).join(', '),
        district: o.district || '',
        state: o.state || '',
        pincode: o.pincode || '',
        orders: [],
        totalSpent: 0,
        firstOrderDate: o.date || '—',
        lastOrderDate: o.date || '—',
        firstOrderTimeMs: orderTimeMs || Infinity,
        lastOrderTimeMs: orderTimeMs || 0
      });
    }

    const cust = customerMap.get(key);
    cust.orders.push(o);
    cust.totalSpent += orderCost;

    // Prefer best non-empty name & contact info
    if (o.firstName && (!cust.name || cust.name === 'Customer')) cust.name = o.firstName;
    if (o.email && !cust.email) cust.email = o.email;
    if (o.district && !cust.district) cust.district = o.district;
    if (o.state && !cust.state) cust.state = o.state;
    if (o.pincode && !cust.pincode) cust.pincode = o.pincode;

    if (orderTimeMs > 0) {
      if (orderTimeMs < cust.firstOrderTimeMs) {
        cust.firstOrderTimeMs = orderTimeMs;
        cust.firstOrderDate = o.date || new Date(orderTimeMs).toLocaleDateString('en-IN');
      }
      if (orderTimeMs >= cust.lastOrderTimeMs) {
        cust.lastOrderTimeMs = orderTimeMs;
        cust.lastOrderDate = o.date || new Date(orderTimeMs).toLocaleDateString('en-IN');
        // Update to most recent address and name
        cust.address = [o.address1, o.address2, o.district, o.state, o.pincode].filter(Boolean).join(', ');
        if (o.firstName) cust.name = o.firstName;
      }
    }
  });

  // Calculate order counts, averages, and segments
  const list = Array.from(customerMap.values());
  list.forEach(cust => {
    // Sort customer's orders: newest first
    cust.orders.sort((a, b) => {
      const timeA = (a.createdAt?.toDate?.()?.getTime()) || Number(a.timestampMs) || 0;
      const timeB = (b.createdAt?.toDate?.()?.getTime()) || Number(b.timestampMs) || 0;
      return timeB - timeA;
    });

    cust.orderCount = cust.orders.length;
    cust.avgOrderValue = cust.orderCount > 0 ? (cust.totalSpent / cust.orderCount) : 0;
    cust.isRepeat = cust.orderCount > 1;

    // Loyalty Tier
    if (cust.orderCount >= 5) {
      cust.tier = 'VIP Platinum (5+)';
      cust.tierBadge = '<span class="cust-badge-tag tag-vip">👑 Platinum VIP (5+)</span>';
      cust.avatarClass = 'vip';
    } else if (cust.orderCount >= 3) {
      cust.tier = 'VIP Gold (3-4)';
      cust.tierBadge = '<span class="cust-badge-tag tag-vip">⭐ Gold VIP (3-4)</span>';
      cust.avatarClass = 'vip';
    } else if (cust.orderCount === 2) {
      cust.tier = 'Repeat Silver (2)';
      cust.tierBadge = '<span class="cust-badge-tag tag-repeat">🔁 Repeat Buyer (2x)</span>';
      cust.avatarClass = 'repeat';
    } else {
      cust.tier = '1-Time Buyer';
      cust.tierBadge = '<span class="cust-badge-tag tag-onetime">👤 1-Time Buyer</span>';
      cust.avatarClass = '';
    }

    // Days since last purchase
    if (cust.lastOrderTimeMs > 0) {
      const diffDays = Math.floor((Date.now() - cust.lastOrderTimeMs) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) cust.lastOrderAgo = 'Today';
      else if (diffDays === 1) cust.lastOrderAgo = 'Yesterday';
      else cust.lastOrderAgo = `${diffDays} days ago`;
    } else {
      cust.lastOrderAgo = 'Recent';
    }

    // Collect distinct item titles purchased & calculate Sample vs Regular split
    const itemMap = new Map();
    let hasSample = false;
    let hasRegular = false;
    let sampleOrdersCount = 0;
    let regularOrdersCount = 0;
    let sampleSpend = 0;
    let regularSpend = 0;
    let firstSampleTimeMs = Infinity;
    let firstRegularTimeMs = Infinity;
    let firstSampleDate = '';
    let firstRegularDate = '';

    cust.orders.forEach(ord => {
      let orderHasSample = false;
      let orderHasRegular = false;
      const oTime = (ord.createdAt?.toDate?.()?.getTime()) || Number(ord.timestampMs) || (ord.date ? new Date(ord.date).getTime() : 0);
      const oDateStr = ord.date || (oTime ? new Date(oTime).toLocaleDateString('en-IN') : '');

      if (Array.isArray(ord.items) && ord.items.length > 0) {
        ord.items.forEach(it => {
          const title = it.title || 'Product';
          itemMap.set(title, (itemMap.get(title) || 0) + (it.quantity || 1));

          const itemTotal = (Number(it.price) || 0) * (Number(it.quantity) || 1);
          if (isSampleProductItem(it)) {
            orderHasSample = true;
            sampleSpend += itemTotal;
          } else {
            orderHasRegular = true;
            regularSpend += itemTotal;
          }
        });
      } else {
        // Fallback for orders without item breakdown: treat as regular
        orderHasRegular = true;
      }

      if (orderHasSample) {
        hasSample = true;
        sampleOrdersCount++;
        if (oTime > 0 && oTime < firstSampleTimeMs) {
          firstSampleTimeMs = oTime;
          firstSampleDate = oDateStr;
        }
      }
      if (orderHasRegular) {
        hasRegular = true;
        regularOrdersCount++;
        if (oTime > 0 && oTime < firstRegularTimeMs) {
          firstRegularTimeMs = oTime;
          firstRegularDate = oDateStr;
        }
      }
    });

    cust.productSummary = Array.from(itemMap.entries()).map(([t, q]) => `${t} (×${q})`).join(', ');

    // Sample & Conversion attributes
    cust.boughtSample = hasSample;
    cust.boughtRegular = hasRegular;
    cust.sampleOrdersCount = sampleOrdersCount;
    cust.regularOrdersCount = regularOrdersCount;
    cust.sampleSpend = sampleSpend;
    cust.regularSpend = regularSpend;
    cust.firstSampleDate = firstSampleDate || '—';
    cust.firstRegularDate = firstRegularDate || '—';

    // Converted: bought Sample AND also ordered Regular product(s)
    cust.isConvertedFromSample = hasSample && hasRegular;

    if (cust.isConvertedFromSample) {
      if (firstRegularTimeMs >= firstSampleTimeMs && firstSampleTimeMs < Infinity) {
        const diffDays = Math.floor((firstRegularTimeMs - firstSampleTimeMs) / (1000 * 60 * 60 * 24));
        cust.conversionGap = diffDays === 0 ? 'Converted Same Day' : `Converted in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
      } else {
        cust.conversionGap = 'Multi-product Buyer';
      }
      cust.sampleBadge = '<span class="cust-badge-tag tag-converted">🎯 Converted (Sample ➔ Regular)</span>';
      if (cust.orderCount < 3) cust.avatarClass = 'converted';
    } else if (hasSample) {
      cust.sampleBadge = '<span class="cust-badge-tag tag-sample">📦 Sample Only Buyer</span>';
      cust.conversionGap = 'Trial Pack Only';
      if (cust.orderCount < 3) cust.avatarClass = 'sample';
    } else {
      cust.sampleBadge = '';
      cust.conversionGap = 'Regular Products';
    }
  });

  _customersList = list;
  return list;
}

// Update Top KPI counters & sidebar notification badge
function updateCustomerAnalytics() {
  const customers = processCustomersData();
  const total = customers.length;
  const oneTimeList = customers.filter(c => c.orderCount === 1);
  const repeatList = customers.filter(c => c.orderCount > 1);
  const vipList = customers.filter(c => c.orderCount >= 3);
  const sampleBuyersList = customers.filter(c => c.boughtSample);
  const convertedList = customers.filter(c => c.isConvertedFromSample);

  const oneTimeRev = oneTimeList.reduce((acc, c) => acc + c.totalSpent, 0);
  const repeatRev = repeatList.reduce((acc, c) => acc + c.totalSpent, 0);
  const sampleRev = sampleBuyersList.reduce((acc, c) => acc + (c.sampleSpend || 0), 0);
  const convertedRev = convertedList.reduce((acc, c) => acc + c.totalSpent, 0);

  const repeatRate = total > 0 ? ((repeatList.length / total) * 100).toFixed(1) : 0;
  const oneTimePct = total > 0 ? ((oneTimeList.length / total) * 100).toFixed(1) : 0;
  const samplePct = total > 0 ? ((sampleBuyersList.length / total) * 100).toFixed(1) : 0;
  const conversionRate = sampleBuyersList.length > 0 ? ((convertedList.length / sampleBuyersList.length) * 100).toFixed(1) : 0;
  const repeatAOV = repeatList.length > 0 ? Math.round(repeatRev / repeatList.length) : 0;

  // Find Top Customer
  let topBuyerName = '—';
  if (repeatList.length > 0) {
    const sortedBySpend = [...repeatList].sort((a, b) => b.totalSpent - a.totalSpent);
    const top = sortedBySpend[0];
    topBuyerName = `${top.name} (${top.orderCount} orders • ₹${top.totalSpent.toLocaleString('en-IN')})`;
  }

  // Update DOM elements if present
  const elTotal = document.getElementById('statCustTotalCount');
  const elOneTime = document.getElementById('statCustOneTimeCount');
  const elOneTimePct = document.getElementById('statCustOneTimePct');
  const elOneTimeRev = document.getElementById('statCustOneTimeRev');
  const elRepeat = document.getElementById('statCustRepeatCount');
  const elRepeatRate = document.getElementById('statCustRepeatRate');
  const elRepeatRev = document.getElementById('statCustRepeatRev');
  const elRepeatAOV = document.getElementById('statCustRepeatAOV');
  const elTopBuyer = document.getElementById('statCustTopBuyer');

  const elSample = document.getElementById('statCustSampleCount');
  const elSamplePct = document.getElementById('statCustSamplePct');
  const elSampleRev = document.getElementById('statCustSampleRev');
  const elConverted = document.getElementById('statCustConvertedCount');
  const elConvertedRate = document.getElementById('statCustConvertedRate');
  const elConvertedRev = document.getElementById('statCustConvertedRev');

  if (elTotal) elTotal.textContent = total.toLocaleString('en-IN');
  if (elOneTime) elOneTime.textContent = oneTimeList.length.toLocaleString('en-IN');
  if (elOneTimePct) elOneTimePct.textContent = `${oneTimePct}% of buyers`;
  if (elOneTimeRev) elOneTimeRev.textContent = `₹${Math.round(oneTimeRev).toLocaleString('en-IN')}`;
  if (elRepeat) elRepeat.textContent = repeatList.length.toLocaleString('en-IN');
  if (elRepeatRate) elRepeatRate.textContent = `${repeatRate}% Repeat Rate`;
  if (elRepeatRev) elRepeatRev.textContent = `₹${Math.round(repeatRev).toLocaleString('en-IN')}`;
  if (elRepeatAOV) elRepeatAOV.textContent = `₹${repeatAOV.toLocaleString('en-IN')}`;
  if (elTopBuyer) elTopBuyer.textContent = topBuyerName;

  if (elSample) elSample.textContent = sampleBuyersList.length.toLocaleString('en-IN');
  if (elSamplePct) elSamplePct.textContent = `${samplePct}% of buyers`;
  if (elSampleRev) elSampleRev.textContent = `₹${Math.round(sampleRev).toLocaleString('en-IN')} spend`;

  if (elConverted) elConverted.textContent = convertedList.length.toLocaleString('en-IN');
  if (elConvertedRate) elConvertedRate.textContent = `${conversionRate}% Conversion`;
  if (elConvertedRev) elConvertedRev.textContent = `₹${Math.round(convertedRev).toLocaleString('en-IN')}`;

  // Badges on pills
  const bRepeat = document.getElementById('badgeTabRepeat');
  const bOneTime = document.getElementById('badgeTabOneTime');
  const bSample = document.getElementById('badgeTabSample');
  const bSampleConverted = document.getElementById('badgeTabSampleConverted');
  const bAll = document.getElementById('badgeTabAll');
  const bVIP = document.getElementById('badgeTabVIP');

  if (bRepeat) bRepeat.textContent = repeatList.length;
  if (bOneTime) bOneTime.textContent = oneTimeList.length;
  if (bSample) bSample.textContent = sampleBuyersList.length;
  if (bSampleConverted) bSampleConverted.textContent = convertedList.length;
  if (bAll) bAll.textContent = total;
  if (bVIP) bVIP.textContent = vipList.length;

  // Sidebar badge for Repeat Buyers
  const navBadge = document.getElementById('navCustRepeatBadge');
  if (navBadge) navBadge.textContent = repeatList.length;

  // If customersView is currently open, re-render table
  const custView = document.getElementById('customersView');
  if (custView && custView.style.display !== 'none') {
    filterAndRenderCustomers();
  }
}

// Segment Switcher tab click
window.setCustomerSegment = function(segment, btnEl) {
  _activeCustomerSegment = segment;
  document.querySelectorAll('.cust-tab-pill').forEach(btn => btn.classList.remove('active'));
  if (btnEl) {
    btnEl.classList.add('active');
  } else {
    // If called programmatically or via KPI card click
    const pillMap = {
      'repeat': 'custTab-repeat',
      'one_time': 'custTab-onetime',
      'sample_buyers': 'custTab-sample',
      'sample_converted': 'custTab-sample-converted',
      'vip': 'custTab-vip',
      'all': 'custTab-all'
    };
    const pill = document.getElementById(pillMap[segment]);
    if (pill) pill.classList.add('active');
  }

  // Highlight matching KPI Card
  document.querySelectorAll('.cust-kpi-card').forEach(card => card.classList.remove('active-kpi'));
  const cardMap = {
    'repeat': 'kpiCustRepeat',
    'one_time': 'kpiCustOneTime',
    'sample_buyers': 'kpiCustSample',
    'sample_converted': 'kpiCustConverted',
    'vip': 'kpiCustVIP',
    'all': 'kpiCustTotal'
  };
  const activeCardId = cardMap[segment];
  if (activeCardId) {
    const cardEl = document.getElementById(activeCardId);
    if (cardEl) cardEl.classList.add('active-kpi');
  }

  const titleEl = document.getElementById('custSegmentTitle');
  const tipEl = document.getElementById('custSegmentTip');
  if (titleEl) {
    if (segment === 'repeat') {
      titleEl.innerHTML = `<span>🔁 Repeat Buyers (2+ Orders)</span> <span id="custShowingCount" style="font-size:0.78rem; background:rgba(16,185,129,0.2); color:#34d399; padding:3px 10px; border-radius:20px; font-weight:700;">Showing 0</span>`;
      if (tipEl) tipEl.innerHTML = `<span>💡</span> <span>These are your most valuable returning customers. Send VIP discounts & thank-you notes via WhatsApp!</span>`;
    } else if (segment === 'one_time') {
      titleEl.innerHTML = `<span>👤 One-Time Buyers (1 Order)</span> <span id="custShowingCount" style="font-size:0.78rem; background:rgba(96,165,250,0.2); color:#60a5fa; padding:3px 10px; border-radius:20px; font-weight:700;">Showing 0</span>`;
      if (tipEl) tipEl.innerHTML = `<span>💡</span> <span>These customers ordered once. Reach out via WhatsApp with a refill coupon code to convert them into repeat buyers!</span>`;
    } else if (segment === 'sample_buyers') {
      titleEl.innerHTML = `<span>📦 Sample Pack Buyers (Trial Kit)</span> <span id="custShowingCount" style="font-size:0.78rem; background:rgba(244,63,94,0.2); color:#fb7185; padding:3px 10px; border-radius:20px; font-weight:700;">Showing 0</span>`;
      if (tipEl) tipEl.innerHTML = `<span>💡</span> <span>All customers who ordered the 500ml Trial Pack. Send WhatsApp greetings to ask for their review and offer an upgrade coupon for 5L cans!</span>`;
    } else if (segment === 'sample_converted') {
      titleEl.innerHTML = `<span>🎯 Sample ➔ Regular Converted Buyers</span> <span id="custShowingCount" style="font-size:0.78rem; background:rgba(6,182,212,0.2); color:#22d3ee; padding:3px 10px; border-radius:20px; font-weight:700;">Showing 0</span>`;
      if (tipEl) tipEl.innerHTML = `<span>🎉</span> <span>CONVERTED BUYERS: These customers tested the Trial Pack first and subsequently purchased full-size regular products! Highest brand loyalty.</span>`;
    } else if (segment === 'vip') {
      titleEl.innerHTML = `<span>👑 VIP Loyal Buyers (3+ Orders)</span> <span id="custShowingCount" style="font-size:0.78rem; background:rgba(245,158,11,0.2); color:#f59e0b; padding:3px 10px; border-radius:20px; font-weight:700;">Showing 0</span>`;
      if (tipEl) tipEl.innerHTML = `<span>💎</span> <span>Super Loyal Customers with 3 or more purchases. Reward them with exclusive benefits and priority shipping!</span>`;
    } else {
      titleEl.innerHTML = `<span>🌐 All Unique Customers</span> <span id="custShowingCount" style="font-size:0.78rem; background:rgba(99,102,241,0.2); color:#a78bfa; padding:3px 10px; border-radius:20px; font-weight:700;">Showing 0</span>`;
      if (tipEl) tipEl.innerHTML = `<span>💡</span> <span>View entire customer directory sorted by total spend, orders count, or recency.</span>`;
    }
  }

  filterAndRenderCustomers();
};

// Clear Customer Search Input
window.clearCustSearch = function() {
  const input = document.getElementById('custSearchInput');
  if (input) input.value = '';
  const clearBtn = document.getElementById('custSearchClearBtn');
  if (clearBtn) clearBtn.style.display = 'none';
  filterAndRenderCustomers();
};

// Export Current Active Customer Segment to Excel
window.exportCurrentCustomerSegment = function() {
  exportCustomersExcel(_activeCustomerSegment);
};

// Copy Single Customer Phone Number to Clipboard
window.copySinglePhone = function(phone, event) {
  if (event) event.stopPropagation();
  if (!phone) return;
  const clean = normalizeCustomerPhone(phone);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(clean).then(() => {
      showToast(`✓ Copied +91 ${clean} to clipboard!`);
    }).catch(() => {
      prompt('Customer phone number:', clean);
    });
  } else {
    prompt('Customer phone number:', clean);
  }
};

// Filter, Sort, and Render Table Rows
window.filterAndRenderCustomers = function() {
  const tbody = document.getElementById('customersTableBody');
  if (!tbody) return;

  const searchInput = document.getElementById('custSearchInput');
  const q = (searchInput?.value || '').toLowerCase().trim();
  const clearBtn = document.getElementById('custSearchClearBtn');
  if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';

  const sortMode = document.getElementById('custSortSelect')?.value || 'orders_desc';

  // 1. Filter by Segment
  let list = _customersList;
  if (_activeCustomerSegment === 'repeat') {
    list = list.filter(c => c.orderCount > 1);
  } else if (_activeCustomerSegment === 'one_time') {
    list = list.filter(c => c.orderCount === 1);
  } else if (_activeCustomerSegment === 'sample_buyers') {
    list = list.filter(c => c.boughtSample);
  } else if (_activeCustomerSegment === 'sample_converted') {
    list = list.filter(c => c.isConvertedFromSample);
  } else if (_activeCustomerSegment === 'vip') {
    list = list.filter(c => c.orderCount >= 3);
  }

  // 2. Filter by Search Query (Name, Phone, Email, District, Pin, Product, Order ID)
  if (q) {
    const qClean = q.replace(/^#+/, '').trim();
    const qDigits = q.replace(/\D/g, '');
    list = list.filter(c => {
      const matchName = (c.name || '').toLowerCase().includes(q) || (qClean && (c.name || '').toLowerCase().includes(qClean));
      const phoneStr = String(c.phone || c.rawPhone || '');
      const matchPhone = phoneStr.includes(q) || (qDigits.length >= 3 && phoneStr.replace(/\D/g, '').includes(qDigits));
      const matchEmail = (c.email || '').toLowerCase().includes(q);
      const matchDist = (c.district || '').toLowerCase().includes(q);
      const matchState = (c.state || '').toLowerCase().includes(q);
      const matchPin = (c.pincode || '').includes(q);
      const matchProd = (c.productSummary || '').toLowerCase().includes(q);
      const matchOrderId = Array.isArray(c.orders) && c.orders.some(ord => {
        const oId = String(ord.id || '').toLowerCase();
        const rzpId = String(ord.razorpayOrderId || '').toLowerCase();
        return oId.includes(q) || oId.includes(qClean) || (rzpId && rzpId.includes(q));
      });
      return matchName || matchPhone || matchEmail || matchDist || matchState || matchPin || matchProd || matchOrderId;
    });
  }

  // 3. Sort List
  list.sort((a, b) => {
    if (sortMode === 'spend_desc') return b.totalSpent - a.totalSpent;
    if (sortMode === 'orders_desc') {
      if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount;
      return b.totalSpent - a.totalSpent;
    }
    if (sortMode === 'recent_desc') return (b.lastOrderTimeMs || 0) - (a.lastOrderTimeMs || 0);
    if (sortMode === 'first_desc') return (a.firstOrderTimeMs || 0) - (b.firstOrderTimeMs || 0);
    if (sortMode === 'name_asc') return (a.name || '').localeCompare(b.name || '');
    return 0;
  });

  // Track currently rendered list for 1-click clipboard phone copy
  _currentlyRenderedCustomers = list;

  const countBadge = document.getElementById('custShowingCount');
  if (countBadge) countBadge.textContent = `Showing ${list.length}`;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-cell" style="padding:32px 16px; text-align:center; color:var(--muted); font-size:0.92rem;">🔍 No customers found matching the current search or segment filter.</td></tr>`;
    return;
  }

  let html = '';
  list.forEach(c => {
    const initial = (c.name || 'C').charAt(0).toUpperCase();
    const cleanPhone = c.phone.length === 10 ? c.phone : (c.rawPhone.replace(/\D/g, '').slice(-10));
    
    // Outreach Message link
    const waUrl = generateWhatsAppLink(c);
    const callUrl = cleanPhone ? `tel:+91${cleanPhone}` : '#';

    // Summary of products
    const prodSnippet = c.productSummary ? (c.productSummary.length > 55 ? c.productSummary.slice(0, 55) + '…' : c.productSummary) : '—';
    const locSnippet = [c.district, c.state].filter(Boolean).join(', ') || (c.pincode ? `PIN: ${c.pincode}` : '—');

    html += `
    <tr style="transition:background 0.2s ease;">
      <td style="padding:14px 16px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="cust-avatar ${c.avatarClass}">${initial}</div>
          <div>
            <div style="font-weight:700; color:#fff; font-size:0.92rem;">${c.name}</div>
            <div style="font-size:0.8rem; color:var(--muted); margin-top:3px; display:flex; align-items:center; gap:6px;">
              <span>📞 ${cleanPhone ? `+91 ${cleanPhone}` : '—'}</span>
              ${cleanPhone ? `<button onclick="copySinglePhone('${cleanPhone}', event)" title="Copy phone number" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:#93c5fd; cursor:pointer; font-size:0.72rem; padding:1px 6px; border-radius:4px; transition:0.2s; line-height:1.3;">📋 Copy</button>` : ''}
            </div>
            ${c.email ? `<div style="font-size:0.75rem; color:#818cf8; margin-top:2px;">✉️ ${c.email}</div>` : ''}
          </div>
        </div>
      </td>
      <td style="padding:14px 16px;">
        <div>${c.tierBadge}</div>
        ${c.sampleBadge ? `<div style="margin-top:5px;">${c.sampleBadge}</div>` : ''}
        <div style="font-size:0.74rem; color:var(--muted); margin-top:4px;">
          ${c.orderCount === 1 ? 'Single Purchase' : `${c.orderCount} Orders Placed`}
        </div>
      </td>
      <td style="padding:14px 16px;">
        <div style="font-weight:800; font-size:1.05rem; color:var(--green);">₹${Math.round(c.totalSpent).toLocaleString('en-IN')}</div>
        <div style="font-size:0.74rem; color:var(--muted); margin-top:3px;">
          ${c.orderCount > 1 ? `Avg: ₹${Math.round(c.avgOrderValue)} / ord` : '1st Order'}
        </div>
        ${c.isConvertedFromSample ? `<div style="font-size:0.72rem; color:#22d3ee; margin-top:3px; background:rgba(6,182,212,0.12); padding:2px 6px; border-radius:4px; display:inline-block;">Reg: ₹${Math.round(c.regularSpend)} • Spl: ₹${Math.round(c.sampleSpend)}</div>` : ''}
      </td>
      <td style="padding:14px 16px;">
        <div style="font-size:0.85rem; font-weight:600; color:var(--text);">${locSnippet}</div>
        <div style="font-size:0.74rem; color:var(--muted); margin-top:3px; max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${c.address}">
          📍 ${c.address || '—'}
        </div>
      </td>
      <td style="padding:14px 16px;">
        <div style="font-size:0.82rem; font-weight:600; color:#cbd5e1;">Last: ${c.lastOrderDate}</div>
        <div style="font-size:0.74rem; color:#a78bfa; margin-top:3px;">⏳ ${c.lastOrderAgo}</div>
        ${c.isConvertedFromSample ? `<div style="font-size:0.72rem; color:#34d399; margin-top:3px; font-weight:700;">⚡ ${c.conversionGap}</div>` : (c.orderCount > 1 ? `<div style="font-size:0.72rem; color:var(--muted); margin-top:2px;">First: ${c.firstOrderDate}</div>` : '')}
      </td>
      <td style="padding:14px 16px;">
        <div style="font-size:0.8rem; color:#cbd5e1; max-width:210px; line-height:1.45;" title="${c.productSummary}">
          🛍️ ${prodSnippet}
        </div>
      </td>
      <td style="text-align:center; padding:14px 16px;">
        <div style="display:flex; gap:6px; justify-content:center; align-items:center; flex-wrap:wrap;">
          <button class="btn-cust-action btn-cust-view" onclick="openCustomerHistory('${c.key}')" title="View all orders">
            👁️ Orders (${c.orderCount})
          </button>
          ${cleanPhone ? `
            <a href="${waUrl}" target="_blank" class="btn-cust-action btn-cust-wa" title="Send WhatsApp Message">
              💬 WhatsApp
            </a>
            <a href="${callUrl}" class="btn-cust-action btn-cust-call" title="Call Customer">
              📞
            </a>
          ` : ''}
        </div>
      </td>
    </tr>`;
  });

  tbody.innerHTML = html;
};

// Open Customers Section
window.renderCustomersSection = function() {
  updateCustomerAnalytics();
};

// WhatsApp Link Generator with segment-personalized messaging
function generateWhatsAppLink(cust) {
  const cleanPhone = cust.phone.length === 10 ? cust.phone : (cust.rawPhone.replace(/\D/g, '').slice(-10));
  if (!cleanPhone) return '#';

  let msg = '';
  if (cust.isConvertedFromSample) {
    // Sample to Regular Converted Buyer
    msg = `Vanakkam ${cust.name}! 🌟 Greetings from KRM Brite!\n\nThank you for choosing KRM Brite! We noticed you tried our 500ml Trial Pack and then upgraded to our regular home-care products.\n\nWe are delighted to have you as part of our KRM Brite family! How has your experience been with our cleaning liquids?\n\nAs a converted VIP member, we would love to offer you free delivery & special discount on your upcoming refills. Just let us know right here! ✨`;
  } else if (cust.boughtSample && !cust.boughtRegular) {
    // Sample Only Buyer (Retarget for 5L can / combo refill)
    msg = `Vanakkam ${cust.name}! 🌟 Greetings from KRM Brite!\n\nWe hope you received and tried your KRM Brite 500ml Trial Liquid Detergent + Fabric Conditioner Pack! 🧴✨\n\nHow did you like the fragrance, fabric softness, and cleaning power on your clothes?\n\nWe would love your genuine feedback! Also, we have a SPECIAL UPGRADE OFFER waiting for you with an exclusive discount coupon on our 5-Litre cans.\n\nReply 'YES' to claim your special coupon code! 🎁`;
  } else if (cust.orderCount > 1) {
    // Repeat Buyer VIP Message
    msg = `Vanakkam ${cust.name}! 🌟 Greetings from KRM Brite!\n\nWe would like to personally thank you for being one of our valued loyal customers with ${cust.orderCount} orders.\n\nYour continuous support means the world to us. As a VIP appreciation gesture, please let us know whenever you need your next refill or if you'd like an exclusive repeat customer discount!\n\nThank you for trusting KRM Brite! ✨`;
  } else {
    // One-Time Buyer Retargeting / Follow-up Message
    msg = `Vanakkam ${cust.name}! 🌟 Greetings from KRM Brite!\n\nThank you for choosing KRM Brite for your cleaning needs. We hope you loved our products and their shine!\n\nWe would love to know your feedback! Also, whenever you are ready for a refill, we have an exclusive special coupon offer waiting for your next order.\n\nFeel free to reply right here anytime! ✨`;
  }

  return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

// 1-Click Copy Phone Numbers of currently rendered customers (for WhatsApp Broadcast / SMS)
window.copyCurrentCustomerPhones = function() {
  const list = _currentlyRenderedCustomers || [];
  if (list.length === 0) {
    alert('No customers in the current list to copy.');
    return;
  }

  const phoneSet = new Set();
  list.forEach(c => {
    const clean = normalizeCustomerPhone(c.phone || c.rawPhone);
    if (clean && clean.length === 10) {
      phoneSet.add(clean);
    }
  });

  const phones = Array.from(phoneSet);
  if (phones.length === 0) {
    alert('No valid 10-digit phone numbers found in the current list.');
    return;
  }

  const phoneText = phones.join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(phoneText).then(() => {
      showToast(`✓ Copied ${phones.length} phone numbers to clipboard! Ready for WhatsApp broadcast.`);
    }).catch(() => {
      prompt('Copy phone numbers below (Ctrl+C):', phoneText);
    });
  } else {
    prompt('Copy phone numbers below (Ctrl+C):', phoneText);
  }
};

// Open Customer Order History Modal
window.openCustomerHistory = function(key) {
  const cust = _customersList.find(c => c.key === key);
  if (!cust) return;

  const modal = document.getElementById('customerHistoryModal');
  const initial = (cust.name || 'C').charAt(0).toUpperCase();

  document.getElementById('modalCustAvatar').textContent = initial;
  document.getElementById('modalCustAvatar').className = `cust-avatar ${cust.avatarClass}`;
  document.getElementById('modalCustName').textContent = cust.name;
  
  let badgesHtml = cust.tierBadge || '';
  if (cust.sampleBadge) badgesHtml += ` ${cust.sampleBadge}`;
  document.getElementById('modalCustTierBadge').innerHTML = badgesHtml;
  
  const cleanPhone = cust.phone.length === 10 ? cust.phone : (cust.rawPhone.replace(/\D/g, '').slice(-10));
  let metaHtml = `
    📞 Phone: <strong>${cleanPhone ? `+91 ${cleanPhone}` : '—'}</strong> | 
    ✉️ Email: <strong>${cust.email || '—'}</strong> | 
    📍 Location: <strong>${cust.district || ''} ${cust.state ? `, ${cust.state}` : ''} (${cust.pincode || '—'})</strong>
  `;

  if (cust.isConvertedFromSample) {
    metaHtml += `<div style="margin-top:6px; font-size:0.78rem; background:rgba(6,182,212,0.15); border:1px solid rgba(6,182,212,0.3); color:#22d3ee; padding:4px 10px; border-radius:6px; display:inline-flex; align-items:center; gap:6px;">🎯 <strong>Converted:</strong> Tried Sample (${cust.firstSampleDate}) ➔ Upgraded to Regular (${cust.firstRegularDate}) • ${cust.conversionGap}</div>`;
  } else if (cust.boughtSample) {
    metaHtml += `<div style="margin-top:6px; font-size:0.78rem; background:rgba(244,63,94,0.15); border:1px solid rgba(244,63,94,0.3); color:#fb7185; padding:4px 10px; border-radius:6px; display:inline-flex; align-items:center; gap:6px;">📦 <strong>Sample Pack Customer:</strong> Has not ordered regular products yet. Retarget with refill coupon!</div>`;
  }
  document.getElementById('modalCustMeta').innerHTML = metaHtml;

  // Stats Grid in modal
  const statsGrid = document.getElementById('modalCustStatsGrid');
  statsGrid.innerHTML = `
    <div style="background:#0f172a; padding:12px; border-radius:10px; border:1px solid var(--border);">
      <div style="font-size:0.72rem; color:var(--muted); font-weight:700; text-transform:uppercase;">Total Orders</div>
      <div style="font-size:1.3rem; font-weight:800; color:#fff; margin-top:3px;">${cust.orderCount}</div>
    </div>
    <div style="background:#0f172a; padding:12px; border-radius:10px; border:1px solid var(--border);">
      <div style="font-size:0.72rem; color:var(--muted); font-weight:700; text-transform:uppercase;">Lifetime Spend</div>
      <div style="font-size:1.3rem; font-weight:800; color:var(--green); margin-top:3px;">₹${Math.round(cust.totalSpent).toLocaleString('en-IN')}</div>
    </div>
    <div style="background:#0f172a; padding:12px; border-radius:10px; border:1px solid var(--border);">
      <div style="font-size:0.72rem; color:var(--muted); font-weight:700; text-transform:uppercase;">Average Order</div>
      <div style="font-size:1.3rem; font-weight:800; color:#60a5fa; margin-top:3px;">₹${Math.round(cust.avgOrderValue)}</div>
    </div>
    <div style="background:#0f172a; padding:12px; border-radius:10px; border:1px solid var(--border);">
      <div style="font-size:0.72rem; color:var(--muted); font-weight:700; text-transform:uppercase;">Last Purchased</div>
      <div style="font-size:1rem; font-weight:800; color:#f59e0b; margin-top:5px;">${cust.lastOrderAgo}</div>
    </div>
  `;

  document.getElementById('modalCustOrderCount').textContent = cust.orders.length;

  // Timeline list of all orders
  const ordersListEl = document.getElementById('modalCustOrdersList');
  ordersListEl.innerHTML = '';

  cust.orders.forEach((ord, idx) => {
    const itemsHtml = (ord.items || []).map(it => {
      const isSample = isSampleProductItem(it);
      const sampleTag = isSample ? '<span style="font-size:0.68rem; background:rgba(244,63,94,0.2); color:#fb7185; padding:2px 6px; border-radius:4px; margin-left:6px; font-weight:700;">📦 Sample Pack</span>' : '';
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#0f172a; padding:6px 10px; border-radius:6px; font-size:0.82rem; margin-bottom:4px;">
          <span><strong>${it.title}</strong> × ${it.quantity} ${sampleTag}</span>
          <span style="color:var(--accent); font-weight:700;">₹${((it.price || 0) * (it.quantity || 1)).toFixed(0)}</span>
        </div>
      `;
    }).join('');

    const statusBadge = (ord.status === 'Paid' || ord.status === 'paid') ? 
      '<span class="badge badge-success">✓ Paid</span>' : 
      `<span class="badge badge-warn">${ord.status || 'Pending'}</span>`;

    const trackingBadge = ord.trackingId ? 
      `<span class="ti-badge" style="font-size:0.75rem;">🚚 ${ord.trackingId}</span>` : 
      '<span style="color:var(--muted); font-size:0.75rem;">Dispatched without tracking</span>';

    ordersListEl.innerHTML += `
      <div style="background:#1a2235; border:1px solid var(--border); border-radius:12px; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-weight:800; color:#818cf8; font-size:0.95rem;">#${ord.id}</span>
              ${statusBadge}
              <span style="font-size:0.75rem; color:var(--muted);">Order #${cust.orders.length - idx}</span>
            </div>
            <div style="font-size:0.8rem; color:var(--muted); margin-top:3px;">
              📅 ${ord.day || ''} ${ord.date || ''} • 🕐 ${ord.time || ''}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:1.15rem; font-weight:800; color:var(--green);">${ord.totalCost || '₹0'}</div>
            <div style="margin-top:2px;">${trackingBadge}</div>
          </div>
        </div>

        <div style="margin-top:10px;">
          <div style="font-size:0.75rem; color:var(--muted); text-transform:uppercase; font-weight:700; margin-bottom:6px;">Items in this order:</div>
          ${itemsHtml}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.05); font-size:0.78rem; color:var(--muted);">
          <span>Delivery Partner: <strong style="color:var(--text);">${ord.deliveryBy || 'ST Courier'}</strong></span>
          ${ord.couponCode ? `<span style="color:#34d399;">🎟️ Coupon Applied: <strong>${ord.couponCode}</strong> (-₹${ord.discountAmount || 0})</span>` : ''}
        </div>
      </div>
    `;
  });

  // Footer WhatsApp & Call buttons
  const waBtnEl = document.getElementById('modalCustWaBtn');
  if (cleanPhone) {
    waBtnEl.innerHTML = `
      <a href="${generateWhatsAppLink(cust)}" target="_blank" class="btn-cust-action btn-cust-wa" style="padding:9px 18px; font-size:0.85rem;">
        💬 Send WhatsApp Greeting
      </a>
      <a href="tel:+91${cleanPhone}" class="btn-cust-action btn-cust-call" style="padding:9px 16px; font-size:0.85rem; margin-left:8px;">
        📞 Call Customer
      </a>
    `;
  } else {
    waBtnEl.innerHTML = `<span style="color:var(--muted); font-size:0.8rem;">No mobile phone saved for this customer.</span>`;
  }

  modal.classList.add('show');
};

window.closeCustomerModal = function() {
  const modal = document.getElementById('customerHistoryModal');
  if (modal) modal.classList.remove('show');
};

// Export Customers to Excel via XLSX library
window.exportCustomersExcel = function(segment) {
  if (typeof XLSX === 'undefined') {
    alert('Excel library (XLSX) is still loading. Please try again in a few moments.');
    return;
  }

  processCustomersData();
  let list = _customersList;
  const dateStr = new Date().toISOString().slice(0, 10);
  let filename = `KRM_Brite_Customers_${dateStr}.xlsx`;
  let sheetName = 'Customers';

  if (segment === 'repeat') {
    list = list.filter(c => c.orderCount > 1);
    filename = `KRM_Brite_Repeat_Buyers_${dateStr}.xlsx`;
    sheetName = 'Repeat Buyers';
  } else if (segment === 'one_time') {
    list = list.filter(c => c.orderCount === 1);
    filename = `KRM_Brite_One_Time_Buyers_${dateStr}.xlsx`;
    sheetName = '1-Time Buyers';
  } else if (segment === 'sample_buyers') {
    list = list.filter(c => c.boughtSample);
    filename = `KRM_Brite_Sample_Pack_Buyers_${dateStr}.xlsx`;
    sheetName = 'Sample Buyers';
  } else if (segment === 'sample_converted') {
    list = list.filter(c => c.isConvertedFromSample);
    filename = `KRM_Brite_Sample_Converted_Buyers_${dateStr}.xlsx`;
    sheetName = 'Converted Buyers';
  } else if (segment === 'vip') {
    list = list.filter(c => c.orderCount >= 3);
    filename = `KRM_Brite_VIP_Buyers_${dateStr}.xlsx`;
    sheetName = 'VIP Loyal';
  } else {
    filename = `KRM_Brite_All_Customers_${dateStr}.xlsx`;
    sheetName = 'All Customers';
  }

  if (list.length === 0) {
    alert('No customer records to export for the selected filter.');
    return;
  }

  const rows = list.map((c, idx) => ({
    'S.No': idx + 1,
    'Customer Name': c.name,
    'Mobile Number': c.phone ? `+91 ${c.phone}` : c.rawPhone,
    'Email Address': c.email || '—',
    'Customer Segment': c.orderCount > 1 ? `Repeat Buyer (${c.orderCount} Orders)` : 'One-Time Buyer (1 Order)',
    'Sample Status': c.isConvertedFromSample ? '🎯 Converted (Sample ➔ Regular)' : (c.boughtSample ? '📦 Sample Only Buyer' : 'Direct Regular Buyer'),
    'Trial Pack Tried': c.boughtSample ? 'Yes' : 'No',
    'Converted to Regular': c.isConvertedFromSample ? 'Yes' : 'No',
    'Conversion Gap': c.conversionGap || '—',
    'First Sample Order Date': c.firstSampleDate || '—',
    'First Regular Order Date': c.firstRegularDate || '—',
    'Total Orders Placed': c.orderCount,
    'Sample Spend (₹)': Math.round(c.sampleSpend || 0),
    'Regular Spend (₹)': Math.round(c.regularSpend || 0),
    'Total Lifetime Spend (₹)': Math.round(c.totalSpent),
    'Average Order Value (₹)': Math.round(c.avgOrderValue),
    'First Order Date': c.firstOrderDate,
    'Last Order Date': c.lastOrderDate,
    'Days Since Last Order': c.lastOrderAgo,
    'District': c.district || '—',
    'State': c.state || '—',
    'Pincode': c.pincode || '—',
    'Full Delivery Address': c.address || '—',
    'Purchased Products Summary': c.productSummary || '—'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);

  showToast(`✓ Exported ${list.length} customers to ${filename}!`);
};


