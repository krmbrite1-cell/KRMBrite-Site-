// Automatically clean .html from browser address bar
(function cleanUrlBar() {
    if (window.location.pathname.endsWith('.html')) {
        const cleanPath = window.location.pathname.replace(/\.html$/, '');
        const targetPath = (cleanPath === '/index' || cleanPath === 'index') ? '/' : cleanPath;
        window.history.replaceState(null, '', targetPath + window.location.search + window.location.hash);
    }
})();

// 🎁 Capture referral code from URL across the entire shop (?ref=CODE or ?coupon=CODE)
(function captureReferralCode() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref') || urlParams.get('coupon');
        if (ref) {
            const clean = ref.trim().toUpperCase();
            sessionStorage.setItem('krm_ref_code', clean);
            localStorage.setItem('krm_ref_code', clean);
        }
    } catch(e) {}
})();

// Cart state
let cart = JSON.parse(localStorage.getItem('mixx-cart')) || [];

// Product overrides from Firestore (admin editable)
window._productOverrides = {};
window._productStock = {};

// Cached YouTube Shorts configuration for Reviews section
window._reviewShortsConfig = null;
try {
    const _cachedShorts = localStorage.getItem('krm_review_shorts_config');
    if (_cachedShorts) window._reviewShortsConfig = JSON.parse(_cachedShorts);
} catch(e) {}

// ── CACHE HELPERS (localStorage - DISABLED for freshness) ─────────────────
const _CACHE_TTL = 0; // Disabled to ensure admin changes show immediately
function _cacheGet(key) {
    // Return null to force background fetch every time as requested by user
    return null;
}
function _cacheSet(key, data) {
    // Still save to local storage for future reference, but _cacheGet will ignore it
    try { localStorage.setItem('krm_c_' + key, JSON.stringify({ d: data, t: Date.now() })); } catch(e) {}
}
// ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // ⚡ Initialize interactive UI immediately using existing static DOM (0ms instant display)
    if (!window._appInitialized) {
        initApp();
        window._appInitialized = true;
    }
    // 📡 Fetch Firebase overrides in background
    loadProductOverridesAndInit();
});

function loadProductOverridesAndInit() {
    // Immediately hide any cached hidden products from initial static DOM to avoid layout flash
    try {
        let cachedHidden = JSON.parse(localStorage.getItem('krm_hidden_products') || '[]');
        if (Array.isArray(cachedHidden)) {
            // Ensure sample-product is always visible and not blocked by old cache
            cachedHidden = cachedHidden.filter(id => id !== 'sample-product');
            localStorage.setItem('krm_hidden_products', JSON.stringify(cachedHidden));
            cachedHidden.forEach(id => {
                const el = document.getElementById('card-' + id);
                if (el) el.style.display = 'none';
            });
        }
    } catch(e) {}

    // 🚀 Capture static products once at the start of this function
    const _staticProducts = (typeof storeData !== 'undefined' && storeData.products) ? [...storeData.products] : [];
    
    let ovData = {};
    let fsData = [];
    let stockData = {};
    
    // Status flags for first load
    let flags = { ov: false, fs: false, st: false };
    let localHasRendered = false;

    // Helper to apply all updates and re-render
    const syncUI = (force = false) => {
        // If it's the very first time, we wait until all 3 flags are true OR a timeout occurs
        if (!localHasRendered && !force) {
            if (!flags.ov || !flags.fs || !flags.st) return;
        }
        
        localHasRendered = true;

        window._productOverrides = ovData;
        window._productStock = stockData;

        // Start with fresh static products
        let mergedProducts = _staticProducts.map(p => {
            const ov = ovData[p.id] || {};
            // Protect high-resolution official assets from being overwritten by low-res base64 / overrides
            let finalImages = p.images;
            if (ov.images && Array.isArray(ov.images) && ov.images.length > 0) {
                const hasBase64 = ov.images.some(img => typeof img === 'string' && img.startsWith('data:image'));
                if (!hasBase64 && p.id !== 'sample-product') {
                    finalImages = ov.images;
                }
            }
            return {
                ...p,
                ...ov,
                images: (p.id === 'sample-product' && p.images && p.images.length > 0) ? p.images : finalImages
            };
        });

        // Add dynamic products from Firestore
        fsData.forEach(pData => {
            // Ignore legacy liquid-detergent product from Firestore if present
            if (pData.id === 'liquid-detergent') return;

            const existing = mergedProducts.find(p => p.id === pData.id);
            if (!existing) {
                mergedProducts.push({ ...pData, ...(ovData[pData.id] || {}) });
            } else {
                Object.assign(existing, pData, ovData[pData.id] || {});
            }
        });

        storeData.products = mergedProducts;

        // Cache hidden product IDs
        try {
            const hiddenIds = mergedProducts.filter(p => p.hidden).map(p => p.id);
            localStorage.setItem('krm_hidden_products', JSON.stringify(hiddenIds));
        } catch(e) {}
        
        // 🚀 Initial full build
        if (!window._appInitialized || force) {
            initApp();
            window._appInitialized = true;
        }

        // 🚀 Product Page specific initialization
        if (typeof initProductPage === 'function' && (!window._productPageInitialized || force)) {
            initProductPage();
            window._productPageInitialized = true;
        }

        // 🔄 Dispatch global event
        window.dispatchEvent(new CustomEvent('krm:dataUpdated'));

        // 🔄 Re-render UI components
        if (document.getElementById('product-grid')) renderProducts();
        if (typeof renderProductDetails === 'function') renderProductDetails();
        if (typeof updateStockDisplay === 'function') updateStockDisplay();
        
        // 🚀 Trigger background precaching for all images (Idea 2)
        _triggerBackgroundPrecache(mergedProducts);

        // Remove any loading skeletons if they exist
        document.querySelectorAll('.skeleton-card, .skeleton-status-msg').forEach(el => el.remove());
    };

    // Safety timeout: If Firestore is slow, apply static data after 800ms anyway
    setTimeout(() => {
        if (!localHasRendered) {
            console.warn("Firestore slow, falling back to static data");
            syncUI(true); 
        }
    }, 800);

    // ── Real-time Listeners ──
    db.collection('productOverrides').onSnapshot(snap => {
        ovData = {};
        snap.forEach(d => { ovData[d.id] = d.data(); });
        flags.ov = true;
        syncUI();
    }, err => { flags.ov = true; syncUI(); });

    db.collection('firestoreProducts').onSnapshot(snap => {
        fsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        flags.fs = true;
        syncUI();
    }, err => { flags.fs = true; syncUI(); });

    db.collection('stock').onSnapshot(snap => {
        stockData = {};
        snap.forEach(d => { stockData[d.id] = d.data(); });
        flags.st = true;
        syncUI();
    }, err => { flags.st = true; syncUI(); });

    db.collection('settings').doc('siteConfig').onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.youtubeUrl) {
                _applyYoutubeUrl(data.youtubeUrl);
            }
            if (data.reviewShortsUrl !== undefined) {
                const vidId = data.reviewShortsVideoId || extractYoutubeId(data.reviewShortsUrl);
                window._reviewShortsConfig = {
                    url: data.reviewShortsUrl,
                    videoId: vidId,
                    enabled: data.reviewShortsEnabled !== false && !!vidId,
                    title: data.reviewShortsTitle || 'Customer Review'
                };
                try {
                    localStorage.setItem('krm_review_shorts_config', JSON.stringify(window._reviewShortsConfig));
                } catch(e) {}
                renderPublicReviews();
                if (typeof renderProductReviews === 'function') renderProductReviews();
            }
        }
    });
}

function extractYoutubeId(url) {
    if (!url) return null;
    url = url.trim();
    if (/^[\w-]{11}$/.test(url)) {
        return url;
    }
    const match = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|.*[?&]v=))([\w-]{11})/);
    return match ? match[1] : null;
}

function _applyYoutubeUrl(url) {
    if (!url) return;
    const videoId = extractYoutubeId(url);
    if (!videoId) return;

    window._currentYtVideoId = videoId;
    window._latestGlobalYoutubeUrl = url;
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

    const iframes = document.querySelectorAll('.youtube-embed, iframe[data-yt], #ytEmbed');
    iframes.forEach(f => { f.src = embedUrl; });

    const thumbImg = document.querySelector('#ytThumbContainer img, .yt-thumb-img');
    if (thumbImg) {
        thumbImg.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }

    const container = document.getElementById('ytThumbContainer');
    if (container) {
        const activeIframe = container.querySelector('iframe');
        if (activeIframe) {
            activeIframe.src = embedUrl;
        }
    }
}

function getReviewShortsHTML() {
    let config = window._reviewShortsConfig;
    if (!config) {
        try {
            const cached = localStorage.getItem('krm_review_shorts_config');
            if (cached) config = JSON.parse(cached);
        } catch(e) {}
    }
    if (!config || !config.enabled || !config.videoId) return '';

    const title = config.title ? config.title : 'Customer Review';
    return `
      <div class="review-shorts-section" id="reviewShortsSection">
        <div class="review-shorts-card">
          <div class="review-shorts-header">
            <div class="review-shorts-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>Shorts</span>
            </div>
            <span class="review-shorts-title">${title}</span>
          </div>
          <div class="review-shorts-frame-container">
            <iframe 
              class="review-shorts-iframe"
              src="https://www.youtube-nocookie.com/embed/${config.videoId}?rel=0&modestbranding=1&playsinline=1" 
              title="${title}"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowfullscreen>
            </iframe>
          </div>
        </div>
      </div>
    `;
}
window.getReviewShortsHTML = getReviewShortsHTML;

function initApp() {
    renderGlobalSettings();
    renderNavigation();
    renderHero();
    renderProducts();
    initDrawers();
    updateCartIcon();
    renderCartDrawer();
    initAuth();
}

function initAuth() {
    const headerIcons = document.querySelector('.header-icons');

    // 1. Add "My Orders" button directly in header (replacing profile icon)
    if (headerIcons && !document.getElementById('my-orders-header-btn')) {
        const myOrdersHtml = `
            <a href="https://wa.me/917094328711" target="_blank" id="whatsapp-header-btn" title="WhatsApp Enquiry" style="
                display: flex; align-items: center; justify-content: center;
                color: #16a34a; text-decoration: none;
                padding: 7px; border-radius: 8px;
                border: 2px solid #bbf7d0;
                background: #f0fdf4; cursor: pointer;
                transition: background 0.2s, border-color 0.2s;
            "
            onmouseover="this.style.background='#dcfce7'; this.style.borderColor='#22c55e';"
            onmouseout="this.style.background='#f0fdf4'; this.style.borderColor='#bbf7d0';">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
            </a>
            <a href="#" id="my-orders-header-btn" title="My Orders" style="
                display: flex; align-items: center; gap: 6px;
                font-weight: 700; font-size: 13px;
                color: var(--text-dark); text-decoration: none;
                padding: 7px 13px; border-radius: 8px;
                border: 2px solid var(--border-color);
                background: #f8fafc; cursor: pointer;
                white-space: nowrap; transition: background 0.2s, border-color 0.2s;
            "
            onmouseover="this.style.background='#e0f2fe'; this.style.borderColor='var(--primary)';"
            onmouseout="this.style.background='#f8fafc'; this.style.borderColor='var(--border-color)';">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:17px;height:17px;flex-shrink:0;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span class="my-orders-label">My Orders</span>
            </a>
        `;
        const cartIcon = document.getElementById('cart-icon-btn');
        if (cartIcon) {
            cartIcon.insertAdjacentHTML('beforebegin', myOrdersHtml);
        } else {
            headerIcons.insertAdjacentHTML('afterbegin', myOrdersHtml);
        }
    }

    // 2. Listen to auth state — wire up My Orders button + mobile menu auth section
    auth.onAuthStateChanged(user => {
        const myOrdersBtn = document.getElementById('my-orders-header-btn');
        if (myOrdersBtn) {
            myOrdersBtn.onclick = (e) => {
                e.preventDefault();
                window.location.href = '/profile';
            };
        }

        // 3. Inject/update auth section inside mobile menu drawer
        const mobileNav = document.getElementById('mobile-nav');
        if (mobileNav) {
            let mobileAuthSection = document.getElementById('mobile-auth-section');
            if (!mobileAuthSection) {
                mobileAuthSection = document.createElement('div');
                mobileAuthSection.id = 'mobile-auth-section';
                mobileAuthSection.style.cssText = 'margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color);';
                mobileNav.appendChild(mobileAuthSection);
            }

            if (user) {
                const displayName = user.isAnonymous ? 'Guest User' : (user.displayName || 'My Account');
                const avatarHtml = (user.photoURL && !user.isAnonymous)
                    ? `<img src="${user.photoURL}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid var(--primary);flex-shrink:0;">`
                    : `<span style="width:32px;height:32px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;">${displayName.charAt(0).toUpperCase()}</span>`;

                mobileAuthSection.innerHTML = `
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                        ${avatarHtml}
                        <div>
                            <div style="font-weight:700;font-size:14px;color:var(--text-dark);">${displayName}</div>
                            <div style="font-size:11px;color:#64748b;">Logged in</div>
                        </div>
                    </div>
                    <a href="/profile" style="display:flex;align-items:center;gap:10px;padding:11px 14px;background:#f0f9ff;border-radius:10px;text-decoration:none;color:var(--text-dark);font-weight:700;font-size:14px;margin-bottom:10px;">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:18px;height:18px;color:var(--primary);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        My Orders
                    </a>
                    <button onclick="auth.signOut().then(()=>window.location.reload())" style="width:100%;padding:11px;background:#fee2e2;color:#dc2626;border:none;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;">
                        Logout
                    </button>
                `;
            } else {
                mobileAuthSection.innerHTML = `
                    <a href="/profile" style="display:flex;align-items:center;gap:10px;padding:11px 14px;background:#f0f9ff;border-radius:10px;text-decoration:none;color:var(--text-dark);font-weight:700;font-size:14px;margin-bottom:10px;">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:18px;height:18px;color:var(--primary);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        My Orders
                    </a>
                    <a href="/login" onclick="sessionStorage.setItem('redirect_after_login', window.location.href)" style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:12px;background:var(--primary);color:#fff;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;box-sizing:border-box;">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:18px;height:18px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Login / Register (Optional)
                    </a>
                `;
            }
        }
    });
}

function renderGlobalSettings() {
    // ✅ Do NOT override the SEO-optimised title set in index.html
    // Title is already set correctly: "KRM Brite | Premium Floor Cleaner Concentrate..."
}

function renderNavigation() {
    const desktopNav = document.getElementById('desktop-nav');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (!desktopNav || !mobileNav || typeof storeData === 'undefined' || !storeData.navigation) return;
    
    desktopNav.innerHTML = '';
    mobileNav.innerHTML = '';
    
    storeData.navigation.forEach(item => {
        const desktopLink = `<a href="${item.link}">${item.name}</a>`;
        desktopNav.innerHTML += desktopLink;
        mobileNav.innerHTML += desktopLink;
    });
}

let currentSlideIndex = 0;
let slideInterval = null;

function renderHero() {
    const sliderContainer = document.getElementById('hero-slider');
    if (!sliderContainer) return;
    
    const existingSlides = sliderContainer.querySelectorAll('.hero-slide');
    if (existingSlides.length > 1) {
        setupSlider();
        return;
    } else if (existingSlides.length === 1 && (!storeData.hero.slides || storeData.hero.slides.length <= 1)) {
        if (slideInterval) clearInterval(slideInterval);
        return;
    }
    
    if (storeData.hero.slides && storeData.hero.slides.length > 0) {
        storeData.hero.slides.forEach((slideImg, index) => {
            // Skip slides that are already present in DOM
            if (index < existingSlides.length) return;
            
            const slideDiv = document.createElement('div');
            slideDiv.className = `hero-slide ${index === 0 && existingSlides.length === 0 ? 'active' : ''}`;
            const link = document.createElement('a');
            link.href = slideImg.includes('Sample') ? '/product?id=sample-product' : '#products';
            link.style.display = 'block';
            link.style.width = '100%';
            link.style.height = '100%';
            
            const picture = document.createElement('picture');
            if (slideImg.includes('Sample')) {
                picture.innerHTML = `
                    <source media="(max-width: 768px)" srcset="HI/SampleMobile.webp" type="image/webp">
                    <source media="(max-width: 768px)" srcset="HI/SampleMobile.png" type="image/png">
                    <source media="(min-width: 769px)" srcset="HI/SampleBanner.webp" type="image/webp">
                    <img src="HI/SampleBanner.png" alt="500ml Sample Liquid Detergent + Fabric Conditioner" class="loaded" onload="this.classList.add('loaded')" loading="${index === 0 ? 'eager' : 'lazy'}" width="1920" height="1080">
                `;
            } else if (slideImg.includes('Main.png')) {
                picture.innerHTML = `
                    <source media="(max-width: 768px)" srcset="HI/Box.webp" type="image/webp">
                    <source media="(max-width: 768px)" srcset="HI/MainBox.png" type="image/png">
                    <img src="HI/Main.png" alt="KRM Brite Premium Concentrates" class="loaded" onload="this.classList.add('loaded')" loading="lazy" width="1919" height="1080">
                `;
            } else {
                picture.innerHTML = `<img src="${slideImg}" alt="Hero Slide ${index + 1}" class="loaded" onload="this.classList.add('loaded')" loading="lazy">`;
            }
            
            link.appendChild(picture);
            slideDiv.appendChild(link);
            sliderContainer.appendChild(slideDiv);
        });
        
        const allSlides = sliderContainer.querySelectorAll('.hero-slide');
        if (allSlides.length > 1) {
            setupSlider();
        }
    }
}

function setupSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    if(slides.length === 0) return;
    
    if (slideInterval) clearInterval(slideInterval);
    
    slideInterval = setInterval(() => {
        slides[currentSlideIndex].classList.remove('active');
        currentSlideIndex = (currentSlideIndex + 1) % slides.length;
        slides[currentSlideIndex].classList.add('active');
    }, 4000);
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating > fullStars;
    let starsHtml = '';
    for(let i=0; i<5; i++) {
        if(i < fullStars) starsHtml += '★';
        else if(i === fullStars && hasHalfStar) starsHtml += '☆'; // We'll keep simplified half star or use a symbol
        else starsHtml += '☆';
    }
    return starsHtml;
}

// Helper to check if a review's productId matches a target product (handles legacy detergent IDs)
function isProductReviewMatch(revProductId, targetProductId) {
    if (!revProductId || !targetProductId) return false;
    if (revProductId === targetProductId) return true;
    const legacyDetergents = ['liquid-detergent', 'detergent-fabric-conditioner'];
    if (legacyDetergents.includes(revProductId) && legacyDetergents.includes(targetProductId)) {
        return true;
    }
    return false;
}

function getProductRating(productId) {
    const staticProduct = (typeof storeData !== 'undefined' && storeData.products) 
        ? storeData.products.find(p => p.id === productId) 
        : null;

    const baseCount = staticProduct ? (staticProduct.reviewsCount || 120) : 120;
    const baseRating = staticProduct ? (staticProduct.rating || 4.9) : 4.9;

    let userReviews = (typeof reviews !== 'undefined' && Array.isArray(reviews)) 
        ? reviews.filter(r => isProductReviewMatch(r.productId, productId) && r.status === 'approved') 
        : [];

    let totalCount = baseCount + userReviews.length;
    let totalSum = baseRating * baseCount;
    userReviews.forEach(r => totalSum += (r.rating || 5));
    
    let finalRating = (totalSum / totalCount).toFixed(1);
    if (isNaN(finalRating) || parseFloat(finalRating) > 5.0) finalRating = "4.9";

    return {
        rating: finalRating,
        count: totalCount,
        isLive: true
    };
}

// 🚀 Modern Loading Animation (Skeletons)
function renderProductSkeletons() {
    const container = document.getElementById('product-grid');
    if (!container || container.children.length > 0) return;

    // Show 4 skeletons initially
    let html = '';
    for (let i = 0; i < 4; i++) {
        html += `
            <div class="skeleton-card">
                <div class="skeleton-img"><div class="shimmer"></div></div>
                <div class="skeleton-text skeleton-badge"><div class="shimmer"></div></div>
                <div class="skeleton-text skeleton-title"><div class="shimmer"></div></div>
                <div class="skeleton-text skeleton-price"><div class="shimmer"></div></div>
                <div class="skeleton-text skeleton-btn"><div class="shimmer"></div></div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function renderProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    // Filter out hidden products
    const visibleProducts = storeData.products.filter(p => !p.hidden);

    // Preload product images if not already
    if (typeof _preloadProductImages === 'function') {
        _preloadProductImages(visibleProducts);
    }

    if (visibleProducts.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted, #64748b); font-size: 1.05rem;">No products are currently available. Please check back soon!</div>';
        return;
    }

    // Toggle single-product layout class
    const isSingle = visibleProducts.length === 1;
    if (isSingle) {
        grid.classList.add('single-product');
    } else {
        grid.classList.remove('single-product');
    }

    // Check if cards already exist in the DOM for these visibleProducts (e.g. from static HTML)
    const existingCards = Array.from(grid.querySelectorAll('.product-card'));
    const canUpdateInPlace = existingCards.length === visibleProducts.length && visibleProducts.every(p => {
        return grid.querySelector(`#card-${p.id}`) || grid.querySelector(`a[href*="id=${p.id}"]`);
    });

    if (canUpdateInPlace) {
        // FAST IN-PLACE UPDATE: Never destroy or recreate <img> nodes so images stay visible with 0ms delay
        visibleProducts.forEach((product, index) => {
            const card = grid.querySelector(`#card-${product.id}`) || grid.querySelector(`a[href*="id=${product.id}"]`)?.closest('.product-card');
            if (!card) return;

            // Ensure card id is set
            if (!card.id) card.id = `card-${product.id}`;

            const stats = getProductRating(product.id);
            const displayRating = stats.count > 0 ? stats.rating : 0;
            const displayCount = stats.count > 0 ? stats.count : 0;
            const savings = (product.compareAtPrice && product.compareAtPrice > product.price) 
                ? Math.round(product.compareAtPrice - product.price) 
                : 0;

            // Update reviews
            const reviewsEl = card.querySelector('.product-reviews');
            if (reviewsEl) {
                const starsSpan = reviewsEl.querySelector('.stars');
                if (starsSpan) starsSpan.innerHTML = generateStars(parseFloat(displayRating));
                const textSpan = reviewsEl.querySelector('span:last-child');
                if (textSpan) textSpan.textContent = `${displayRating} / 5.0 (${displayCount} reviews)`;
            }

            // Update price
            const priceCurrent = card.querySelector('.price-current');
            if (priceCurrent) {
                priceCurrent.textContent = `${storeData.settings.currencySymbol} ${product.price.toFixed(2)} ${storeData.settings.currencyCode}`;
            }
            const priceCompare = card.querySelector('.price-compare');
            if (priceCompare) {
                if (product.compareAtPrice) {
                    priceCompare.textContent = `Rs. ${product.compareAtPrice.toFixed(2)} INR`;
                    priceCompare.style.display = '';
                } else {
                    priceCompare.style.display = 'none';
                }
            }
            const discountPill = card.querySelector('.price-discount-pill');
            if (discountPill) {
                if (isSingle && savings > 0) {
                    discountPill.textContent = `Save Rs. ${savings}`;
                    discountPill.style.display = '';
                } else {
                    discountPill.style.display = 'none';
                }
            }

            // Update OOS status & action buttons
            const isOOS = window._productStock[product.id] && (window._productStock[product.id].total - window._productStock[product.id].sold) <= 0;
            const actions = card.querySelector('.product-card-actions');
            if (isOOS) {
                card.classList.add('oos');
                if (!card.querySelector('.out-of-stock-badge')) {
                    const imgWrap = card.querySelector('.product-image-wrap');
                    if (imgWrap) imgWrap.insertAdjacentHTML('beforeend', '<div class="out-of-stock-badge">Out of Stock</div>');
                }
                if (actions) actions.innerHTML = '<button class="btn btn-oos" disabled>Out of Stock</button>';
            } else {
                card.classList.remove('oos');
                const oosBadge = card.querySelector('.out-of-stock-badge');
                if (oosBadge) oosBadge.remove();
                if (actions && actions.querySelector('.btn-oos')) {
                    actions.innerHTML = `
                        <button class="btn btn-secondary" onclick="addToCart('${product.id}')">Add to cart</button>
                        <button class="btn btn-buy-now" onclick="buyNow('${product.id}')">⚡ Buy Now</button>
                    `;
                }
            }

            // Ensure image is immediately 100% visible
            const imgDefault = card.querySelector('.img-default');
            if (imgDefault) {
                imgDefault.style.opacity = '1';
                if (index === 0) imgDefault.decoding = 'sync';
            }
        });
        return;
    }

    // Fallback: If grid didn't have cards or product list changed, render full cards
    const fragment = document.createDocumentFragment();

    visibleProducts.forEach((product, index) => {
        let badgesHtml = product.badges.map(b => `<span class="badge" style="${b === 'Sale' ? 'background: var(--sale-badge);' : 'background: black; top: 10px; bottom: auto;'}">${b}</span>`).join('');

        const stats = getProductRating(product.id);
        const displayRating = stats.count > 0 ? stats.rating : 0;
        const displayCount = stats.count > 0 ? stats.count : 0;

        // First 2 products: eager load (above-the-fold) + high priority + sync decoding for #1
        const imgLoadAttr = index < 2 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" fetchpriority="low"';
        const img2LoadAttr = index < 2 ? 'loading="eager"' : 'loading="lazy"';
        const decodingAttr = index === 0 ? 'decoding="sync"' : 'decoding="async"';

        const savings = (product.compareAtPrice && product.compareAtPrice > product.price) 
            ? Math.round(product.compareAtPrice - product.price) 
            : 0;

        const isOOS = window._productStock[product.id] && (window._productStock[product.id].total - window._productStock[product.id].sold) <= 0;

        const cardHtml = `
            <div class="product-card" id="card-${product.id}">
                <a href="/product?id=${product.id}" class="product-image-wrap">
                    ${badgesHtml}
                    <span class="badge badge-open">Open</span>
                    <img src="${product.images[0]}" 
                         class="img-default" 
                         alt="${product.title}" 
                         ${imgLoadAttr} 
                         ${decodingAttr} 
                         width="400" height="400"
                         style="opacity: 1;"
                         onerror="if(this.src.endsWith('.avif'))this.src=this.src.replace('.avif','.webp')">
                    ${product.images.length > 1 ? `
                        <img src="${product.images[1]}" 
                             class="img-hover" 
                             alt="${product.title} alternate view" 
                             ${img2LoadAttr} 
                             decoding="async" 
                             width="400" height="400"
                             onerror="if(this.src.endsWith('.avif'))this.src=this.src.replace('.avif','.webp')">` : ''}
                </a>
                <div class="product-info">
                    ${product.boughtText ? `<div class="product-bought-badge"><span class="bought-fire">🔥</span>${product.boughtText}</div>` : ''}
                    <a href="/product?id=${product.id}" class="product-title">${product.title}</a>
                    <div class="product-reviews">
                        <span class="stars">${generateStars(parseFloat(displayRating))}</span>
                        <span>${displayRating} / 5.0 (${displayCount} reviews)</span>
                    </div>
                    ${isSingle ? `
                        <ul class="single-prod-highlights">
                            <li><span class="chk">✓</span> Makes Instant 5 Litres at Home</li>
                            <li><span class="chk">✓</span> 2-in-1 Powerful Detergent + Fabric Conditioner</li>
                            <li><span class="chk">✓</span> 99.9% Hospital-Grade Germ & Virus Protection</li>
                        </ul>
                    ` : ''}
                    <div class="product-price">
                        <span class="price-current">${storeData.settings.currencySymbol} ${product.price.toFixed(2)} ${storeData.settings.currencyCode}</span>
                        ${product.compareAtPrice ? `<span class="price-compare">Rs. ${product.compareAtPrice.toFixed(2)} INR</span>` : ''}
                        ${(isSingle && savings > 0) ? `<span class="price-discount-pill">Save Rs. ${savings}</span>` : ''}
                    </div>
                    <div class="product-card-actions">
                        ${isOOS
                            ? `<button class="btn btn-oos" disabled>Out of Stock</button>`
                            : `
                                <button class="btn btn-secondary" onclick="addToCart('${product.id}')">Add to cart</button>
                                <button class="btn btn-buy-now" onclick="buyNow('${product.id}')">⚡ Buy Now</button>
                            `
                        }
                    </div>
                    ${isSingle ? `
                        <div class="single-prod-delivery">
                            <span>🚚</span> <strong>Fast ST & Professional Courier Delivery</strong> across India
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHtml;
        const card = tempDiv.firstElementChild;

        if (isOOS) {
            card.classList.add('oos');
            const imgWrap = card.querySelector('.product-image-wrap');
            if (imgWrap) {
                imgWrap.insertAdjacentHTML('beforeend', '<div class="out-of-stock-badge">Out of Stock</div>');
            }
        }

        fragment.appendChild(card);
    });

    grid.innerHTML = '';
    grid.appendChild(fragment);
}


// Drawer Interactions
function initDrawers() {
    // Menu
    const menuBtn = document.getElementById('hamburger-btn');
    const menuCloseBtn = document.getElementById('mobile-menu-close');
    const menuDrawer = document.getElementById('mobile-menu');
    const menuOverlay = document.getElementById('mobile-menu-overlay');

    const toggleMenu = () => {
        menuDrawer.classList.toggle('active');
        menuOverlay.classList.toggle('active');
    };

    menuBtn?.addEventListener('click', toggleMenu);
    menuCloseBtn?.addEventListener('click', toggleMenu);
    menuOverlay?.addEventListener('click', toggleMenu);

    // Cart
    const cartBtn = document.getElementById('cart-icon-btn');
    const cartCloseBtn = document.getElementById('cart-close');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-overlay');

    window.toggleCart = () => {
        cartDrawer.classList.toggle('active');
        cartOverlay.classList.toggle('active');
    };

    cartBtn?.addEventListener('click', toggleCart);
    cartCloseBtn?.addEventListener('click', toggleCart);
    cartOverlay?.addEventListener('click', toggleCart);
}

// Cart Functionality
function addToCart(productId, qty = 1, openDrawer = true) {
    const product = storeData.products.find(p => p.id === productId);
    if(!product || product.hidden) {
        showToast("This product is currently unavailable.", "error");
        return;
    }
    
    const existingIndex = cart.findIndex(item => item.id === productId);
    if(existingIndex >= 0) {
        if (openDrawer) {
            showToast("Product is already in your cart.", "success");
        }
    } else {
        cart.push({ ...product, quantity: qty });
    }
    
    saveCart();
    updateCartIcon();
    renderCartDrawer();
    
    if (openDrawer) {
        const cartDrawer = document.getElementById('cart-drawer');
        const cartOverlay = document.getElementById('cart-overlay');
        if (cartDrawer && !cartDrawer.classList.contains('active')) {
            cartDrawer.classList.add('active');
            if (cartOverlay) cartOverlay.classList.add('active');
        }
    }
}

function buyNow(productId, qty = 1) {
    const product = storeData.products.find(p => p.id === productId);
    if (!product || product.hidden) {
        showToast("This product is currently unavailable.", "error");
        return;
    }

    const buyNowItem = {
        id: product.id,
        title: product.title,
        price: product.price,
        quantity: qty,
        images: product.images
    };

    // 🚀 Isolated Buy Now: Save to localStorage for better persistence
    localStorage.setItem('krm_buy_now_item', JSON.stringify(buyNowItem));
    window.location.href = 'checkout.html';
}

function updateCartQuantity(productId, delta) {
    const index = cart.findIndex(item => item.id === productId);
    if(index >= 0) {
        cart[index].quantity += delta;
        if(cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
        updateCartIcon();
        renderCartDrawer();
    }
}

function saveCart() {
    localStorage.setItem('mixx-cart', JSON.stringify(cart));
}

function updateCartIcon() {
    const countSpan = document.getElementById('cart-count');
    if(!countSpan) return;
    
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    countSpan.textContent = count;
}

function removeFromCart(productId) {
    const index = cart.findIndex(item => item.id === productId);
    if(index >= 0) {
        cart.splice(index, 1);
        saveCart();
        updateCartIcon();
        renderCartDrawer();
    }
}

function renderCartDrawer() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total-price');
    if(!container || !totalEl) return;
    
    if(cart.length === 0) {
        container.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        totalEl.textContent = `${storeData.settings.currencySymbol} 0.00 ${storeData.settings.currencyCode}`;
        return;
    }
    
    let html = '';
    let total = 0;
    
    window.handleCheckoutClick = () => {
        // 🚀 Ensure we clear any individual "Buy Now" item so the full cart loads instead
        localStorage.removeItem('krm_buy_now_item');
        sessionStorage.removeItem('krm_buy_now_item');
        window.location.href = 'checkout.html';
    };
    
    // Update the footer button
    const cartFooter = document.querySelector('.cart-footer');
    if (cartFooter) {
        const checkoutBtn = cartFooter.querySelector('button');
        if (checkoutBtn) {
            checkoutBtn.onclick = window.handleCheckoutClick;
        }
    }
    
    cart.forEach(item => {
        // 🔄 SYNC: Get latest price from live storeData
        const liveProd = storeData.products.find(p => p.id === item.id);
        const currentPrice = liveProd ? liveProd.price : item.price;
        
        const itemTotal = currentPrice * item.quantity;
        total += itemTotal;
        
        html += `
            <div class="cart-item">
                <img src="${item.images[0]}" class="cart-item-img" alt="${item.title}" onerror="if(this.src.endsWith('.avif'))this.src=this.src.replace('.avif','.webp')">
                <div class="cart-item-info">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div class="cart-item-title">${liveProd ? liveProd.title : item.title}</div>
                        <button onclick="removeFromCart('${item.id}')" style="background:none; border:none; padding:0; color: #ff0000; cursor: pointer; font-size: 12px; text-decoration: underline;">Remove</button>
                    </div>
                    <div class="cart-item-price">${storeData.settings.currencySymbol} ${currentPrice.toFixed(2)}</div>
                    <div class="qty-control">
                        <button class="qty-btn" onclick="updateCartQuantity('${item.id}', -1)">-</button>
                        <input type="text" class="qty-input" value="${item.quantity}" readonly>
                        <button class="qty-btn" onclick="updateCartQuantity('${item.id}', 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    totalEl.textContent = `${storeData.settings.currencySymbol} ${total.toFixed(2)} ${storeData.settings.currencyCode}`;
}

/* --- FIREBASE REVIEWS LOGIC --- */

// Global reviews array - populated from Firestore
let reviews = _cacheGet('reviews') || [];

// Save a new review to Firestore
function saveReviews() {
  // Legacy compatibility - actual saving now done via addReviewToFirestore
  // This function is kept so product.js calls don't break
}

async function addReviewToFirestore(reviewData) {
  try {
    await db.collection('reviews').add({
      ...reviewData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error('Firestore save error:', err);
    return false;
  }
}

// ---------------------------
// REVIEWS LOGIC
// ---------------------------
const reviewsList = document.getElementById('reviewsList');

function renderReviewSummary() {
  const summaryContainer = document.getElementById('reviewSummary');
  if(!summaryContainer) return;

  // Show all approved reviews (both global and product-specific)
  let approvedReviews = reviews.filter(rev => rev.status === 'approved');
  if (approvedReviews.length === 0 && typeof storeData !== 'undefined' && storeData.defaultReviews) {
    approvedReviews = storeData.defaultReviews.filter(rev => rev.status === 'approved');
  }
  const totalReviews = approvedReviews.length;
  if(totalReviews === 0) {
    summaryContainer.style.display = 'none';
    return;
  }
  summaryContainer.style.display = 'flex';

  let totalStars = 0;
  const starCounts = {5:0, 4:0, 3:0, 2:0, 1:0};

  approvedReviews.forEach(rev => {
    totalStars += rev.rating;
    if(starCounts[rev.rating] !== undefined) {
       starCounts[rev.rating]++;
    }
  });

  const avgRating = (totalStars / totalReviews).toFixed(1);

  let barsHTML = '';
  for(let i=5; i>=1; i--) {
    const count = starCounts[i];
    const percentage = ((count / totalReviews) * 100).toFixed(1);
    barsHTML += `
      <div class="rs-bar-row">
        <div class="rs-bar-label">${i} ★</div>
        <div class="rs-bar-outer">
          <div class="rs-bar-inner" style="width: ${percentage}%"></div>
        </div>
        <div class="rs-bar-count">${count}</div>
      </div>
    `;
  }

  summaryContainer.innerHTML = `
    <div class="rs-left">
      <div class="rs-avg">${avgRating}</div>
      <div class="rs-stars">${'★'.repeat(Math.round(avgRating))}${'☆'.repeat(5 - Math.round(avgRating))}</div>
      <div class="rs-total">${totalReviews} global ratings</div>
    </div>
    <div class="rs-bars">
      ${barsHTML}
    </div>
  `;
}

function renderPublicReviews() {
  if(!reviewsList) return;
  reviewsList.innerHTML = '';
  let revHTML = '';
  // Show all approved reviews (both global and product-specific)
  let approvedReviews = reviews.filter(rev => rev.status === 'approved');
  if (approvedReviews.length === 0 && typeof storeData !== 'undefined' && storeData.defaultReviews) {
    approvedReviews = storeData.defaultReviews.filter(rev => rev.status === 'approved');
  }
  
  const shortsVideoHTML = (typeof getReviewShortsHTML === 'function') ? getReviewShortsHTML() : '';
  if(approvedReviews.length === 0) {
    reviewsList.innerHTML = `
      <div style="display: flex; flex-direction: column; width: 100%;">
        ${shortsVideoHTML}
        <div style="text-align:center; color:#94a3b8; padding:40px;">No reviews yet. Be the first to review!</div>
      </div>
    `;
    return;
  }
  
  let allPhotos = [];
  approvedReviews.forEach(rev => {
    let stars = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
    let avatarLetter = (rev.name && rev.name.length > 0) ? rev.name.charAt(0).toUpperCase() : 'A';
    let safeName = rev.name || 'Anonymous';
    
    if (rev.photos && rev.photos.length > 0) {
      rev.photos.forEach(url => {
        allPhotos.push({ url, stars: rev.rating });
      });
    }
    
    revHTML += `
      <div class="review-card">
        <div class="rc-top">
          <div class="rc-user-info">
            <div class="rc-avatar">${avatarLetter}</div>
            <div class="rc-meta">
              <div class="rc-name">${safeName}</div>
              <div class="rc-verified">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> 
                Verified Buyer
              </div>
            </div>
          </div>
          <div class="rc-stars-wrap">
            <div class="rc-stars">${stars}</div>
          </div>
        </div>
        <div class="rc-content">
          <p>"${rev.body}"</p>
        </div>
        ${rev.photos && rev.photos.length > 0 ? `
        <div class="review-photos-grid">
            ${rev.photos.map(url => `
                <img src="${url}" alt="Review photo" class="review-photo-thumb" onclick="openReviewPhotoLightbox('${url}')" loading="lazy">
            `).join('')}
        </div>` : ''}
      </div>
    `;
  });
  
  // Create Customer Photos Gallery HTML if there are any photos
  let galleryHTML = '';
  if (allPhotos.length > 0) {
    const itemWidth = 162; // 150px item + 12px gap
    const totalPhotosWidth = allPhotos.length * itemWidth;
    const isOverflowing = totalPhotosWidth > window.innerWidth;
    
    let photoItems = allPhotos.map(p => `
      <div class="cpg-item" onclick="openReviewPhotoLightbox('${p.url}')">
        <img src="${p.url}" alt="Customer photo" loading="lazy">
        <div class="cpg-stars">${'★'.repeat(p.stars)}${'☆'.repeat(5 - p.stars)}</div>
      </div>
    `).join('');

    if (isOverflowing) {
        const speed = 40; // px per sec
        const duration = totalPhotosWidth / speed;
        galleryHTML = `
          <div class="customer-photos-gallery" style="display: block; width: 100%;">
            <h3 class="cpg-title">Customer photos</h3>
            <div class="photos-marquee-container">
              <div class="photos-marquee" style="animation-duration: ${duration.toFixed(2)}s;">
                ${photoItems}${photoItems}${photoItems}
              </div>
            </div>
          </div>
        `;
    } else {
        galleryHTML = `
          <div class="customer-photos-gallery" style="display: block; width: 100%;">
            <h3 class="cpg-title">Customer photos</h3>
            <div class="cpg-scroll-container">
              ${photoItems}
            </div>
          </div>
        `;
    }
  }
  
  // Ensure lightbox exists on this page too
  if (typeof _ensureReviewLightbox === 'undefined') {
      window._ensureReviewLightbox = function() {
          if (document.getElementById('reviewPhotoLightbox')) return;
          const lb = document.createElement('div');
          lb.id = 'reviewPhotoLightbox';
          lb.className = 'review-lightbox';
          lb.innerHTML = `
              <div class="review-lightbox-backdrop"></div>
              <div class="review-lightbox-content">
                  <button class="review-lightbox-close" onclick="closeReviewPhotoLightbox()">✕</button>
                  <img id="reviewLightboxImg" src="" alt="Review photo">
              </div>
          `;
          lb.querySelector('.review-lightbox-backdrop').addEventListener('click', closeReviewPhotoLightbox);
          document.body.appendChild(lb);
      };
      
      window.openReviewPhotoLightbox = function(url) {
          const lb = document.getElementById('reviewPhotoLightbox');
          if (!lb) return;
          document.getElementById('reviewLightboxImg').src = url;
          lb.classList.add('active');
          document.body.style.overflow = 'hidden';
      };

      window.closeReviewPhotoLightbox = function() {
          const lb = document.getElementById('reviewPhotoLightbox');
          if (!lb) return;
          lb.classList.remove('active');
          document.body.style.overflow = '';
      };
  }
  _ensureReviewLightbox();
  
  // Calculate dynamic duration based on number of reviews to keep speed constant
  // Each card is ~350px + 24px gap = 374px
  const cardWidth = 374;
  const count = approvedReviews.length;
  const totalWidth = count * cardWidth;
  
  // Speed in pixels per second — same on both desktop and mobile
  const speed = 35;
  const duration = totalWidth / speed;

  // Duplicate the reviews inside the marquee for a seamless infinite scroll effect
  const newHTML = `
    <div style="display: flex; flex-direction: column; width: 100%;">
      ${shortsVideoHTML}
      ${galleryHTML}
      <div class="reviews-marquee-container" style="overflow: hidden; display: block; width: 100%;">
        <div class="reviews-marquee" style="animation-duration: ${duration.toFixed(2)}s">${revHTML}${revHTML}${revHTML}</div>
      </div>
    </div>
  `;
  if (reviewsList.innerHTML !== newHTML) {
      reviewsList.innerHTML = newHTML;
  }
}

// Load all reviews from Firestore (real-time listener)
function loadReviewsFromFirestore() {
  db.collection('reviews').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    window.isFirestoreReviewsLoaded = true;
    reviews = snapshot.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
    _cacheSet('reviews', reviews);
    renderReviewSummary();
    renderPublicReviews();
    // Update product cards with new ratings
    if (document.getElementById('product-grid')) renderProducts();
    if (typeof renderProductReviews === 'function') renderProductReviews();
  }, err => {
    console.error('Firestore reviews load error:', err);
  });
}

// Load reviews immediately on page load to prevent "0 reviews" flash
loadReviewsFromFirestore();

// ---------------------------
// SUBMIT REVIEW FORM
// ---------------------------
let selectedRating = 5;
const starsInps = document.querySelectorAll('#starRatingSelector span');
starsInps.forEach((star, idx) => {
  star.addEventListener('click', () => {
    selectedRating = parseInt(star.getAttribute('data-val'));
    starsInps.forEach((s, i) => {
      s.classList.toggle('lit', i < selectedRating);
    });
  });
});

let homeSelectedFiles = [];
const homePhotoInput = document.getElementById('revPhotos');
const homePhotoGrid = document.getElementById('homePhotoPreviewGrid');
const homeUploadLabel = document.getElementById('homePhotoUploadLabel');

if (homePhotoInput && homePhotoGrid) {
    homePhotoInput.addEventListener('change', async () => {
        const files = Array.from(homePhotoInput.files);
        const remaining = 3 - homeSelectedFiles.length;
        const toAdd = files.slice(0, remaining);
        
        const originalText = homeUploadLabel.innerHTML;
        if (toAdd.length > 0) {
            homeUploadLabel.innerHTML = '<div style="padding:10px;">Compressing...</div>';
        }

        try {
            // Compress images using the helper (needs to be available in main.js or globally)
            const compressedFiles = await Promise.all(toAdd.map(f => (typeof compressImage === 'function' ? compressImage(f) : compressImageMain(f))));
            homeSelectedFiles = [...homeSelectedFiles, ...compressedFiles];
            
            renderHomePhotoPreviews(homePhotoGrid, homeSelectedFiles, (updatedFiles) => {
                homeSelectedFiles = updatedFiles;
                if (homeUploadLabel) homeUploadLabel.style.display = homeSelectedFiles.length >= 3 ? 'none' : 'flex';
            });
        } catch (err) {
            console.error("Compression error:", err);
            if (typeof showToast === 'function') showToast('Failed to process one or more images.', 'error');
        }

        if (homeUploadLabel) {
            homeUploadLabel.innerHTML = originalText;
            homeUploadLabel.style.display = homeSelectedFiles.length >= 3 ? 'none' : 'flex';
        }
        homePhotoInput.value = '';
    });
}

function renderHomePhotoPreviews(container, files, onUpdate) {
    container.innerHTML = '';
    files.forEach((base64String, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'photo-preview-item';
        wrapper.innerHTML = `
            <img src="${base64String}" alt="Preview ${index + 1}">
            <button type="button" class="photo-remove-btn" data-index="${index}" title="Remove">✕</button>
        `;
        wrapper.querySelector('.photo-remove-btn').addEventListener('click', () => {
            const newFiles = files.filter((_, i) => i !== index);
            onUpdate(newFiles);
            renderHomePhotoPreviews(container, newFiles, onUpdate);
        });
        container.appendChild(wrapper);
    });
}

// Ensure compressImage exists globally or define it here for main.js
function compressImageMain(file, maxWidth = 800, maxHeight = 800, quality = 0.6) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // Return base64 string directly - avoids Firebase Storage completely
                const base64 = canvas.toDataURL('image/jpeg', quality);
                resolve(base64);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

const reviewForm = document.getElementById('reviewForm');
if(reviewForm) {
  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = reviewForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Submitting Review...';
    submitBtn.disabled = true;

    const newRev = {
      name: document.getElementById('revName').value.trim(),
      body: document.getElementById('revBody').value.trim(),
      rating: selectedRating,
      status: 'pending',
      ...(homeSelectedFiles.length > 0 && { photos: homeSelectedFiles }) // Save Base64 strings directly to DB
    };
    
    const success = await addReviewToFirestore(newRev);
    
    submitBtn.textContent = 'Post Review';
    submitBtn.disabled = false;

    if (success) {
      reviewForm.reset();
      selectedRating = 5;
      homeSelectedFiles = [];
      if (homePhotoGrid) homePhotoGrid.innerHTML = '';
      if (homeUploadLabel) homeUploadLabel.style.display = 'flex';
      starsInps.forEach(s => s.classList.add('lit'));
      showToast('Thank you! Your review has been submitted for approval.', 'success');
    } else {
      showToast('Something went wrong. Please try again.', 'error');
    }
  });
}

// Custom UI Toast Logic
function setupToastStyles() {
    if (document.getElementById('toast-styles')) return;
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.innerHTML = `
        .custom-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fff;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05);
            border-left: 4px solid #10b981;
            padding: 15px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 10000;
            transform: translateX(120%);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: inherit;
            color: #0f172a;
        }
        .custom-toast.error { border-left-color: #ef4444; }
        .custom-toast.show { transform: translateX(0); opacity: 1; }
        .toast-icon { font-size: 1.2rem; }
        .toast-message { font-size: 0.95rem; font-weight: 500; }
    `;
    document.head.appendChild(style);
}

function showToast(message, type = 'success') {
    setupToastStyles();
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${type === 'success' ? '✅' : '⚠️'}</div>
        <div class="toast-message">${message}</div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() =>{
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ---------------------------
// BENEFITS IMAGE SLIDER
// ---------------------------
(function initBenefitsSlider() {
    const slider = document.getElementById('benefitsImgSlider');
    const dotsContainer = document.getElementById('benefitsImgDots');
    if (!slider || !dotsContainer) return;

    const slides = slider.querySelectorAll('.bslide');
    const dots = dotsContainer.querySelectorAll('.bdot');
    let current = 0;
    let bInterval = null;

    function goTo(idx) {
        slides[current].classList.remove('active');
        dots[current].classList.remove('active');
        current = idx;
        slides[current].classList.add('active');
        dots[current].classList.add('active');
    }

    function next() {
        goTo((current + 1) % slides.length);
    }

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            clearInterval(bInterval);
            goTo(i);
            bInterval = setInterval(next, 3000);
        });
    });

    bInterval = setInterval(next, 3000);
})();

// ---------------------------
// SECTION FADE-IN ON SCROLL
// (IntersectionObserver — zero cost until section enters viewport)
// ---------------------------
(function initSectionAnimations() {
    if (!('IntersectionObserver' in window)) return;

    const style = document.createElement('style');
    style.textContent = `
        .scroll-fade-section {
            opacity: 0;
            transform: translateY(28px);
            transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1);
        }
        .scroll-fade-section.in-view {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);

    // Add class to all major sections below the fold
    const sectionsToAnimate = [
        '#how-to-use',
        '#reviews',
        '#about',
        '#reasons',
        '#science',
        '#value',
        '#usage',
        '#benefits'
    ];

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                sectionObserver.unobserve(entry.target); // Fire once only
            }
        });
    }, { threshold: 0.08 });

    sectionsToAnimate.forEach(sel => {
        const el = document.querySelector(sel);
        if (el) {
            el.classList.add('scroll-fade-section');
            sectionObserver.observe(el);
        }
    });
})();

// ---------------------------
// REVIEW COUNT ANIMATION (LOADING EFFECT)
// ---------------------------
function animateReviewCounts() {
    const elements = document.querySelectorAll('.review-count-anim');
    elements.forEach(el => {
        const targetCount = parseInt(el.getAttribute('data-target-count')) || 0;
        el.textContent = targetCount;
    });
}

// 🚀 High-Performance Image Preloading
function _preloadProductImages(products) {
    if (!products || products.length === 0 || window._preloadedImages) return;
    window._preloadedImages = true;

    products.slice(0, 2).forEach(p => {
        if (p.images && p.images[0]) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = p.images[0];
            link.imageSrcset = ""; // Prevents browser from waiting for srcset
            link.fetchPriority = 'high';
            document.head.appendChild(link);
        }
    });
}

// 🚀 Idea 2: Background Precaching
function _triggerBackgroundPrecache(products) {
    if (!products || !navigator.serviceWorker || !navigator.serviceWorker.controller) return;
    
    // Extract all image URLs from all products
    const imageUrls = [];
    products.forEach(p => {
        if (p.images) {
            p.images.forEach(img => {
                if (img && !imageUrls.includes(img)) imageUrls.push(img);
            });
        }
    });

    if (imageUrls.length > 0) {
        navigator.serviceWorker.controller.postMessage({
            type: 'PRECACHE_IMAGES',
            urls: imageUrls
        });
    }
}
