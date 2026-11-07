document.addEventListener('DOMContentLoaded', () => {
    // If main.js has already synced data and initialized the app, we initialize now
    if (window._appInitialized && !window._productPageInitialized) {
        initProductPage();
        window._productPageInitialized = true;
    }
});

let currentProduct = null;
let currentQty = 1;

function initProductPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if(!productId) {
        currentProduct = storeData.products.find(p => !p.hidden) || storeData.products[0];
    } else {
        currentProduct = storeData.products.find(p => p.id === productId) || storeData.products[0];
    }

    // Apply any admin overrides from Firestore
    if (window._productOverrides && currentProduct && window._productOverrides[currentProduct.id]) {
        const ov = window._productOverrides[currentProduct.id];
        const isSample = currentProduct.id === 'sample-product';
        const hasBase64 = ov.images && Array.isArray(ov.images) && ov.images.some(img => typeof img === 'string' && img.startsWith('data:image'));
        const safeImages = (isSample || hasBase64) ? currentProduct.images : (ov.images || currentProduct.images);
        currentProduct = { ...currentProduct, ...ov, images: safeImages };
    }

    reviewsShown = REVIEWS_PER_PAGE;

    // ✅ Update all SEO tags dynamically for this product
    _updateProductSEO(currentProduct);

    renderProductDetails();
    setupProductInteractions();
}

// ✅ Dynamically set title, meta description, canonical, OG tags + JSON-LD per product
function _updateProductSEO(product) {
    if (!product) return;

    const baseUrl  = 'https://www.krmbrite.in';
    const pageUrl  = `${baseUrl}/product?id=${product.id}`;
    const imgUrl   = product.images && product.images[0]
        ? `${baseUrl}/${encodeURI(product.images[0])}`
        : `${baseUrl}/logo.avif`;
    const seoTitle = `${product.title} | KRM Brite - Buy Online India`;
    const seoDesc  = product.description
        ? `${product.description} | 500ml makes 5 litres. 99.9% germ kill. Fast delivery across India.`
        : `Shop ${product.title} from KRM Brite. Premium quality cleaning product. Fast delivery across India.`;

    // Page title
    document.title = seoTitle;

    // Meta description
    let descTag = document.querySelector('meta[name="description"]');
    if (descTag) descTag.content = seoDesc;

    // Canonical
    const canonicalTag = document.getElementById('canonical-tag');
    if (canonicalTag) canonicalTag.href = pageUrl;

    // Open Graph
    const ogUrl   = document.getElementById('og-url');   if (ogUrl)   ogUrl.content   = pageUrl;
    const ogTitle = document.getElementById('og-title'); if (ogTitle) ogTitle.content = seoTitle;
    const ogDesc  = document.getElementById('og-desc');  if (ogDesc)  ogDesc.content  = seoDesc;
    const ogImage = document.getElementById('og-image'); if (ogImage) ogImage.content = imgUrl;

    // Remove previous JSON-LD if any
    const oldLd = document.getElementById('product-jsonld');
    if (oldLd) oldLd.remove();

    // Product JSON-LD for Google Rich Results
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.id   = 'product-jsonld';
    ld.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.title,
        "description": product.description,
        "image": product.images ? product.images.map(i => `${baseUrl}/${i}`) : [imgUrl],
        "brand": { "@type": "Brand", "name": "KRM Brite" },
        "url": pageUrl,
        "sku": product.id,
        "offers": {
            "@type": "Offer",
            "url": pageUrl,
            "priceCurrency": "INR",
            "price": product.price,
            "priceValidUntil": "2027-12-31",
            "availability": "https://schema.org/InStock",
            "seller": { "@type": "Organization", "name": "KRM Brite" }
        },
        "aggregateRating": product.rating && product.reviewsCount ? {
            "@type": "AggregateRating",
            "ratingValue": product.rating,
            "reviewCount": product.reviewsCount
        } : undefined
    });
    document.head.appendChild(ld);
}


// Listen for live updates from admin
window.addEventListener('krm:dataUpdated', () => {
    if (currentProduct) {
        // Re-find the product in storeData to get latest admin changes
        const updated = storeData.products.find(p => p.id === currentProduct.id);
        if (updated) {
            currentProduct = updated;
            renderProductDetails();
            _updateProductSEO(currentProduct);
        }
    }
});

function renderProductDetails() {
    if(!currentProduct) return;

    // Title & Text (title already set by _updateProductSEO, but keep for safety)
    document.title = `${currentProduct.title} | KRM Brite - Buy Online India`;
    document.getElementById('pg-title').textContent = currentProduct.title;
    document.getElementById('pg-desc').textContent = currentProduct.description;
    
    // Bought Badge
    const boughtContainer = document.getElementById('pg-bought-badge-container');
    if (boughtContainer) {
        if (currentProduct.boughtText) {
            boughtContainer.innerHTML = `<div class="product-bought-badge"><span class="bought-fire">🔥</span>${currentProduct.boughtText}</div>`;
            boughtContainer.style.display = 'block';
        } else {
            boughtContainer.innerHTML = '';
            boughtContainer.style.display = 'none';
        }
    }
    
    // Pricing
    document.getElementById('pg-price').textContent = `${storeData.settings.currencySymbol} ${currentProduct.price.toFixed(2)}`;
    if(currentProduct.compareAtPrice) {
        document.getElementById('pg-compare').textContent = `Rs. ${currentProduct.compareAtPrice.toFixed(2)} INR`;
    } else {
        document.getElementById('pg-compare').style.display = 'none';
    }
    
    // Sale Badge
    const hasSale = currentProduct.badges.includes('Sale');
    document.getElementById('pg-sale-badge').style.display = hasSale ? 'inline-block' : 'none';
    
    // Reviews
    const stats = getProductRating(currentProduct.id);
    const displayRating = stats.count > 0 ? stats.rating : 0;
    const displayCount = stats.count > 0 ? stats.count : 0;

    document.getElementById('pg-stars').innerHTML = generateStars(parseFloat(displayRating));
    document.getElementById('pg-reviews-txt').innerHTML = `${displayRating} / 5.0 (${displayCount} reviews)`;

    // Gallery
    const slider = document.getElementById('pg-slider');
    const thumbGrid = document.getElementById('pg-thumbs');
    const dotsContainer = document.getElementById('pg-dots');
    
    if (slider && thumbGrid && dotsContainer) {
        const newSliderHtml = currentProduct.images.map((imgSrc, index) => `
            <div class="pg-slide ${index === 0 ? 'active' : ''}">
                <img src="${imgSrc}" alt="${currentProduct.title} - image ${index + 1}" ${index === 0 ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'} onerror="if(this.src.endsWith('.avif'))this.src=this.src.replace('.avif','.webp')">
            </div>
        `).join('').trim();

        // Check if existing images in DOM already match currentProduct.images to avoid unnecessary reload/flicker
        const existingImgSrcs = Array.from(slider.querySelectorAll('.pg-slide img')).map(img => img.getAttribute('src'));
        const imagesMatch = existingImgSrcs.length === currentProduct.images.length && existingImgSrcs.every((s, i) => s === currentProduct.images[i]);

        if (!imagesMatch) {
            slider.innerHTML = newSliderHtml;
        }

        // Render thumbs & dots if not already populated or if images changed
        if (!imagesMatch || thumbGrid.children.length !== currentProduct.images.length) {
            thumbGrid.innerHTML = '';
            dotsContainer.innerHTML = '';

            currentProduct.images.forEach((imgSrc, index) => {
                // Thumbnail
                const activeClass = index === 0 ? 'active' : '';
                const thumb = document.createElement('img');
                thumb.src = imgSrc;
                thumb.className = `thumb-img ${activeClass}`;
                thumb.alt = `${currentProduct.title} thumbnail ${index + 1}`;
                thumb.loading = index < 4 ? 'eager' : 'lazy';
                thumb.onerror = function() {
                    if (this.src.endsWith('.avif')) this.src = this.src.replace('.avif', '.webp');
                };
                thumb.onclick = () => scrollToImage(index);
                thumbGrid.appendChild(thumb);

                // Dot
                const dot = document.createElement('div');
                dot.className = `dot ${activeClass}`;
                dot.onclick = () => scrollToImage(index);
                dotsContainer.appendChild(dot);
            });

            // Re-bind scroll listener
            slider.addEventListener('scroll', () => {
                const index = Math.round(slider.scrollLeft / slider.offsetWidth);
                updateGalleryUI(index);
            });
        }
    }

    // About Section
    const aboutContainer = document.getElementById('pg-about');
    if(aboutContainer && currentProduct.aboutHtml) {
        aboutContainer.style.display = 'block';
        aboutContainer.innerHTML = currentProduct.aboutHtml;
    } else if(aboutContainer) {
        aboutContainer.style.display = 'none';
    }

    // Video Embed
    const videoContainer = document.getElementById('pg-video-container');
    const videoFrame = document.getElementById('pg-video-frame');
    let videoUrl = (currentProduct && currentProduct.videoUrl) ? currentProduct.videoUrl : window._latestGlobalYoutubeUrl;
    
    if (videoUrl && videoContainer && videoFrame) {
        const videoId = (typeof extractYoutubeId === 'function') ? extractYoutubeId(videoUrl) : null;
        if (videoId) {
            videoFrame.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
            videoContainer.style.display = 'block';
        } else {
            videoContainer.style.display = 'none';
        }
    } else if (videoContainer) {
        videoContainer.style.display = 'none';
    }

    // Product reviews
    renderProductReviews();
    setupProductReviewSubmission();

    // Out of Stock UI
    const stock = window._productStock && window._productStock[currentProduct.id];
    const isOOS = stock && (stock.total - stock.sold) <= 0;
    
    if (isOOS) {
        const buyBtn = document.getElementById('buy-it-now-btn');
        const deskAddBtn = document.getElementById('desktop-add-cart');
        const mobAddBtn = document.getElementById('mobile-add-cart');
        
        if (buyBtn) { 
            buyBtn.textContent = 'OUT OF STOCK'; 
            buyBtn.disabled = true; 
            buyBtn.classList.add('btn-oos'); 
            buyBtn.onclick = null;
        }
        if (deskAddBtn) { 
            deskAddBtn.textContent = 'OUT OF STOCK'; 
            deskAddBtn.disabled = true; 
            deskAddBtn.classList.add('btn-oos'); 
            deskAddBtn.onclick = null;
        }
        if (mobAddBtn) { 
            mobAddBtn.textContent = 'OUT OF STOCK'; 
            mobAddBtn.disabled = true; 
            mobAddBtn.classList.add('btn-oos'); 
            mobAddBtn.onclick = null;
        }
        
        const qtyWrap = document.querySelector('.pd-qty-wrap');
        if (qtyWrap) qtyWrap.style.display = 'none';
        
        const slider = document.getElementById('pg-slider');
        if (slider) {
            slider.style.filter = 'grayscale(0.5)';
            slider.insertAdjacentHTML('afterbegin', '<div class="out-of-stock-badge" style="font-size: 1.5rem; padding: 15px 30px; border-radius: 8px;">OUT OF STOCK</div>');
        }
    }

    // Hidden Product State
    if (currentProduct && currentProduct.hidden) {
        const buyBtn = document.getElementById('buy-it-now-btn');
        const deskAddBtn = document.getElementById('desktop-add-cart');
        const mobAddBtn = document.getElementById('mobile-add-cart');
        
        if (buyBtn) { 
            buyBtn.textContent = 'PRODUCT CURRENTLY UNAVAILABLE'; 
            buyBtn.disabled = true; 
            buyBtn.classList.add('btn-oos'); 
            buyBtn.onclick = null;
        }
        if (deskAddBtn) { 
            deskAddBtn.textContent = 'UNAVAILABLE'; 
            deskAddBtn.disabled = true; 
            deskAddBtn.classList.add('btn-oos'); 
            deskAddBtn.onclick = null;
        }
        if (mobAddBtn) { 
            mobAddBtn.textContent = 'UNAVAILABLE'; 
            mobAddBtn.disabled = true; 
            mobAddBtn.classList.add('btn-oos'); 
            mobAddBtn.onclick = null;
        }
        const qtyWrap = document.querySelector('.pd-qty-wrap');
        if (qtyWrap) qtyWrap.style.display = 'none';

        let hiddenNotice = document.getElementById('pg-hidden-notice');
        if (!hiddenNotice) {
            hiddenNotice = document.createElement('div');
            hiddenNotice.id = 'pg-hidden-notice';
            hiddenNotice.style.cssText = 'background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#dc2626; padding:12px 16px; border-radius:10px; font-weight:600; margin-bottom:16px; font-size:0.9rem; text-align:center;';
            hiddenNotice.innerHTML = '⚠️ This product is currently hidden or not available for purchase on the website.';
            const target = document.getElementById('pg-title');
            if (target && target.parentNode) target.parentNode.insertBefore(hiddenNotice, target);
        }
    } else {
        const hiddenNotice = document.getElementById('pg-hidden-notice');
        if (hiddenNotice) hiddenNotice.remove();
    }
}

const REVIEWS_PER_PAGE = 5;
let reviewsShown = REVIEWS_PER_PAGE;

function renderProductReviews() {
    const list = document.getElementById('productReviewsList');
    const summary = document.getElementById('productReviewSummary');
    if (!list || !summary || !currentProduct) return;

    const matchFn = typeof isProductReviewMatch === 'function' 
        ? isProductReviewMatch 
        : (rId, tId) => rId === tId || (['liquid-detergent', 'detergent-fabric-conditioner'].includes(rId) && ['liquid-detergent', 'detergent-fabric-conditioner'].includes(tId));

    let prodReviews = reviews.filter(r => matchFn(r.productId, currentProduct.id) && r.status === 'approved');

    if (prodReviews.length === 0 && typeof storeData !== 'undefined' && storeData.defaultReviews) {
        prodReviews = storeData.defaultReviews.filter(r => matchFn(r.productId, currentProduct.id) && r.status === 'approved');
    }

    // ---- Render Summary ----
    if (prodReviews.length === 0) {
        const shortsVideoHTML = (typeof getReviewShortsHTML === 'function') ? getReviewShortsHTML() : '';
        list.innerHTML = `
          <div style="display: flex; flex-direction: column; width: 100%;">
            ${shortsVideoHTML}
            <div style="color:#64748b; padding:20px; text-align:center;">No reviews yet for this product. Be the first to write one!</div>
          </div>
        `;
        summary.style.display = 'none';
        removeMoreBtn();
        return;
    }

    summary.style.display = 'flex';
    let totalStars = 0;
    const starCounts = {5:0, 4:0, 3:0, 2:0, 1:0};
    prodReviews.forEach(rev => {
        totalStars += rev.rating;
        starCounts[rev.rating]++;
    });
    const avg = (totalStars / prodReviews.length).toFixed(1);
    let barsHTML = '';
    for (let i = 5; i >= 1; i--) {
        const pct = ((starCounts[i] / prodReviews.length) * 100).toFixed(0);
        barsHTML += `
            <div class="rs-bar-row">
                <div class="rs-bar-label">${i} ★</div>
                <div class="rs-bar-outer"><div class="rs-bar-inner" style="width:${pct}%"></div></div>
                <div class="rs-bar-count">${starCounts[i]}</div>
            </div>`;
    }
    summary.innerHTML = `
        <div class="rs-left">
            <div class="rs-avg">${avg}</div>
            <div class="rs-stars">${'★'.repeat(Math.round(avg))}${'☆'.repeat(5 - Math.round(avg))}</div>
            <div class="rs-total">${prodReviews.length} product reviews</div>
        </div>
        <div class="rs-bars">${barsHTML}</div>`;

    // Update product page top stats
    const starsEl = document.getElementById('pg-stars');
    const txtEl = document.getElementById('pg-reviews-txt');
    if (starsEl && txtEl && typeof getProductRating === 'function') {
        const stats = getProductRating(currentProduct.id);
        const displayRating = stats.count > 0 ? stats.rating : 0;
        const displayCount = stats.count > 0 ? stats.count : 0;

        starsEl.innerHTML = typeof generateStars === 'function' ? generateStars(parseFloat(displayRating)) : '';
        txtEl.innerHTML = `${displayRating} / 5.0 (${displayCount} reviews)`;
    }

    // Create Customer Photos Gallery for Product Page
    let allPhotos = [];
    prodReviews.forEach(rev => {
        if (rev.photos && rev.photos.length > 0) {
            rev.photos.forEach(url => {
                allPhotos.push({ url, stars: rev.rating });
            });
        }
    });
    
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

    // ---- Render paginated list ----
    const visible = prodReviews.slice(0, reviewsShown);
    const reviewsHTML = visible.map(rev => {
        let stars = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
        let avatarLetter = (rev.name && rev.name.length > 0) ? rev.name.charAt(0).toUpperCase() : 'A';
        let safeName = rev.name || 'Anonymous';
        return `
        <div class="review-card" style="width:100%; animation:none; margin-bottom: 20px;">
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
        </div>`;
    }).join('');
    
    const shortsVideoHTML = (typeof getReviewShortsHTML === 'function') ? getReviewShortsHTML() : '';
    list.innerHTML = `
      <div style="display: flex; flex-direction: column; width: 100%;">
        ${shortsVideoHTML}
        ${galleryHTML}
        <div class="product-reviews-container" style="display: block; width: 100%;">
          ${reviewsHTML}
        </div>
      </div>
    `;

    // Setup lightbox if not already in DOM
    _ensureReviewLightbox();

    // ---- Show More button ----
    removeMoreBtn();
    if (reviewsShown < prodReviews.length) {
        const remaining = prodReviews.length - reviewsShown;
        const nextBatch = Math.min(remaining, REVIEWS_PER_PAGE);
        const btn = document.createElement('button');
        btn.id = 'loadMoreReviewsBtn';
        btn.className = 'load-more-reviews-btn';
        btn.textContent = `Show ${nextBatch} more review${nextBatch > 1 ? 's' : ''} (${remaining} left)`;
        btn.addEventListener('click', () => {
            reviewsShown += REVIEWS_PER_PAGE;
            renderProductReviews();
            // Scroll smoothly to first new card
            const cards = list.querySelectorAll('.review-card');
            const firstNew = cards[reviewsShown - REVIEWS_PER_PAGE];
            if (firstNew) firstNew.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        list.after(btn);
    }
}

function removeMoreBtn() {
    const old = document.getElementById('loadMoreReviewsBtn');
    if (old) old.remove();
}

// ---- Review Photo Lightbox ----
function _ensureReviewLightbox() {
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
}

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


function setupProductReviewSubmission() {
    console.log('Setting up product review submission form...');
    const form = document.getElementById('productReviewForm');
    if(!form) {
        console.error('productReviewForm not found!');
        return;
    }
    
    // Remove old listeners if any (re-rendering)
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    console.log('Form cloned and replaced.');

    const starContainer = newForm.querySelector('#productStarRatingSelector');
    let selectedRating = 5;
    let selectedFiles = []; // Track selected photo files

    if (starContainer) {
        const stars = starContainer.querySelectorAll('span');
        console.log('Found stars:', stars.length);
        
        stars.forEach((star, idx) => {
            star.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                selectedRating = parseInt(star.getAttribute('data-val'));
                console.log('Star clicked! Value:', selectedRating);
                
                stars.forEach((s, i) => {
                    const starVal = i + 1;
                    if (starVal <= selectedRating) {
                        s.classList.add('lit');
                    } else {
                        s.classList.remove('lit');
                    }
                });
            });
        });
    }

    // ---- Photo Upload Preview ----
    const photoInput = newForm.querySelector('#prodRevPhotos');
    const photoGrid  = newForm.querySelector('#photoPreviewGrid');
    const uploadLabel = newForm.querySelector('#photoUploadLabel');

    if (photoInput && photoGrid) {
        photoInput.addEventListener('change', async () => {
            const files = Array.from(photoInput.files);
            // Limit to 3 photos total
            const remaining = 3 - selectedFiles.length;
            const toAdd = files.slice(0, remaining);
            
            // Show loading state on label
            const originalText = uploadLabel.innerHTML;
            if (toAdd.length > 0) {
                uploadLabel.innerHTML = '<div style="padding:10px;">Compressing...</div>';
            }

            try {
                // Compress images to Base64 strings
                const compressedFiles = await Promise.all(toAdd.map(f => compressImageToBase64(f)));
                selectedFiles = [...selectedFiles, ...compressedFiles];
                
                renderPhotoPreviews(photoGrid, selectedFiles, (updatedFiles) => {
                    selectedFiles = updatedFiles;
                    if (uploadLabel) uploadLabel.style.display = selectedFiles.length >= 3 ? 'none' : 'flex';
                });
            } catch (err) {
                console.error("Compression error:", err);
                if (typeof showToast === 'function') showToast('Failed to process one or more images.', 'error');
            }

            // Restore label
            if (uploadLabel) {
                uploadLabel.innerHTML = originalText;
                uploadLabel.style.display = selectedFiles.length >= 3 ? 'none' : 'flex';
            }
            photoInput.value = '';
        });
    }

    newForm.onsubmit = async (e) => {
        e.preventDefault();
        console.log('Product review form submitted');

        const submitBtn = newForm.querySelector('#prodRevSubmitBtn');
        if (submitBtn) { submitBtn.textContent = 'Submitting Review...'; submitBtn.disabled = true; }

        const newRev = {
            productId: currentProduct ? currentProduct.id : 'global',
            name: newForm.querySelector('#prodRevName').value.trim(),
            body: newForm.querySelector('#prodRevBody').value.trim(),
            rating: selectedRating,
            status: 'pending',
            ...(selectedFiles.length > 0 && { photos: selectedFiles }) // Save Base64 strings directly to DB
        };

        if (typeof addReviewToFirestore === 'function') {
            const success = await addReviewToFirestore(newRev);
            if (submitBtn) { submitBtn.textContent = 'Post Review'; submitBtn.disabled = false; }

            if (success) {
                if (typeof showToast === 'function') showToast('Thank you! Your review has been submitted for approval.', 'success');
                newForm.reset();
                // Reset stars
                selectedRating = 5;
                selectedFiles = [];
                if (photoGrid) photoGrid.innerHTML = '';
                if (uploadLabel) uploadLabel.style.display = 'flex';
                if (starContainer) {
                    starContainer.querySelectorAll('span').forEach(s => s.classList.add('lit'));
                }
            } else {
                if (typeof showToast === 'function') showToast('Something went wrong. Please try again.', 'error');
            }
        } else {
            console.error('addReviewToFirestore function not found!');
            if (submitBtn) { submitBtn.textContent = 'Post Review'; submitBtn.disabled = false; }
        }
    };
}

// Compress Image Helper - Returns Base64 String
function compressImageToBase64(file, maxWidth = 800, maxHeight = 800, quality = 0.6) {
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
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}

// Render photo thumbnails with remove buttons
function renderPhotoPreviews(container, files, onUpdate) {
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
            renderPhotoPreviews(container, newFiles, onUpdate);
        });
        container.appendChild(wrapper);
    });
}

function updateGalleryUI(index) {
    const thumbs = document.querySelectorAll('.thumb-img');
    const dots = document.querySelectorAll('.dot');
    
    thumbs.forEach((thumb, i) => {
        if (i === index) thumb.classList.add('active');
        else thumb.classList.remove('active');
    });
    
    dots.forEach((dot, i) => {
        if (i === index) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

function scrollToImage(index) {
    const slider = document.getElementById('pg-slider');
    if (slider) {
        slider.scrollTo({
            left: index * slider.offsetWidth,
            behavior: 'smooth'
        });
    }
}

function setupProductInteractions() {
    // Quantity control
    const qtyInput = document.getElementById('pd-qty-input');
    
    document.getElementById('pd-qty-minus').addEventListener('click', () => {
        if(currentQty > 1) {
            currentQty--;
            qtyInput.value = currentQty;
        }
    });
    
    document.getElementById('pd-qty-plus').addEventListener('click', () => {
        currentQty++;
        qtyInput.value = currentQty;
    });
    
    // Add to cart buttons
    const handleAddToCart = () => {
        if(typeof window.addToCart === 'function') {
            window.addToCart(currentProduct.id, currentQty, true);
        }
    };
    
    document.getElementById('desktop-add-cart')?.addEventListener('click', handleAddToCart);
    document.getElementById('mobile-add-cart')?.addEventListener('click', handleAddToCart);
    
    document.getElementById('buy-it-now-btn')?.addEventListener('click', () => {
        const buyNowItem = {
            id: currentProduct.id,
            title: currentProduct.title,
            price: currentProduct.price,
            quantity: currentQty,
            images: currentProduct.images
        };
        
        // 🚀 Isolated Buy Now: Save to localStorage for better persistence
        localStorage.setItem('krm_buy_now_item', JSON.stringify(buyNowItem));
        window.location.href = 'checkout.html';
    });
}
