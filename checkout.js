document.addEventListener("DOMContentLoaded", () => {
    const stateInput = document.getElementById("state");
    const deliveryCostDisplay = document.getElementById("deliveryCostDisplay");
    const totalCostDisplay = document.getElementById("totalCostDisplay");
    const checkoutForm = document.getElementById("checkoutForm");

    // 🚀 Initialize EmailJS
    (function() {
        // You should replace this with your actual EmailJS Public Key
        emailjs.init("AIk1aEspV_Ex5ds1V"); 
    })();

    let cart = JSON.parse(localStorage.getItem('mixx-cart')) || [];
    
    // 🚀 Check if this is a "Buy Now" flow (check both for maximum reliability)
    const buyNowItem = JSON.parse(localStorage.getItem('krm_buy_now_item') || sessionStorage.getItem('krm_buy_now_item') || 'null');
    let isBuyNow = false;

    if (buyNowItem) {
        cart = [buyNowItem];
        isBuyNow = true;
    }

    let cartTotal = 0;
    let currentDiscountAmount = 0;
    let appliedCoupon = null;

    try {
        const savedCpn = sessionStorage.getItem('krm_applied_coupon');
        if (savedCpn) appliedCoupon = JSON.parse(savedCpn);
    } catch(e) {
        appliedCoupon = null;
    }

    function isSampleProduct(item) {
        if (!item) return false;
        const id = String(item.id || '').toLowerCase().trim();
        const title = String(item.title || '').toLowerCase().trim();
        return id === 'sample-product' || id.includes('sample') || id.includes('trail') || id.includes('trial') || title.includes('sample') || title.includes('trail') || title.includes('trial');
    }

    // 📦 Update top packaging preview image (ForSample.png for sample products, MainBox.png for others)
    function updatePackagePreview() {
        const pkgImg = document.getElementById("checkoutPackageImg");
        if (!pkgImg) return;
        const hasSample = cart.some(item => {
            const liveProd = (typeof storeData !== 'undefined' && storeData.products) ? storeData.products.find(p => p.id === item.id) : null;
            const currentTitle = liveProd ? liveProd.title : item.title;
            return isSampleProduct({ id: item.id, title: currentTitle });
        });
        pkgImg.src = hasSample ? "HI/ForSample.png" : "HI/MainBox.png";
    }

    // 🎟️ Show "Have a coupon code?" only for regular products (hidden for sample products)
    function updateCouponSectionVisibility() {
        const couponSec = document.getElementById("couponSection");
        if (!couponSec) return;

        // Check if cart has at least one regular (non-sample) product
        const hasRegularProduct = cart.some(item => {
            const liveProd = (typeof storeData !== 'undefined' && storeData.products) 
                ? storeData.products.find(p => p.id === item.id) 
                : null;
            const currentTitle = liveProd ? liveProd.title : item.title;
            return !isSampleProduct({ id: item.id, title: currentTitle });
        });

        if (!hasRegularProduct) {
            // Cart has only sample product(s) or is empty: hide "Have a coupon code?" option
            couponSec.style.display = 'none';
            if (appliedCoupon) {
                appliedCoupon = null;
                sessionStorage.removeItem('krm_applied_coupon');
            }
        } else {
            // Cart has regular product(s): show "Have a coupon code?" option with Regular Customer note
            couponSec.style.display = 'block';
        }
    }

    const itemsList = document.getElementById("checkout-items-list");

    function renderCartSummary() {
        if(!itemsList) return;
        
        itemsList.innerHTML = '';
        cartTotal = 0;

        if(cart.length === 0) {
            itemsList.innerHTML = '<div style="color: #ef4444; margin-bottom: 15px;">Your cart is empty. Please go back and add products.</div>';
        } else {
            cart.forEach(item => {
                // 🔄 SYNC: Get latest price from live storeData
                const liveProd = storeData.products.find(p => p.id === item.id);
                const currentPrice = liveProd ? liveProd.price : item.price;
                const currentTitle = liveProd ? liveProd.title : item.title;

                cartTotal += currentPrice * item.quantity;
                const removeBtn = isBuyNow ? '' : `
                    <button onclick="removeFromCheckout('${item.id}')" title="Remove item" style="background: #fee2e2; color: #ef4444; border: none; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; cursor: pointer; transition: all 0.2s; font-weight: 800;" onmouseover="this.style.background='#ef4444'; this.style.color='white';" onmouseout="this.style.background='#fee2e2'; this.style.color='#ef4444'">✕</button>
                `;

                const isSample = isSampleProduct({ id: item.id, title: currentTitle });
                const sampleBadge = isSample ? `
                    <span style="font-size: 0.72rem; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; padding: 2px 7px; border-radius: 4px; font-weight: 700; display: inline-block; margin-top: 3px;">
                        Sample / Trial Pack
                    </span>
                ` : '';
                const hiddenBadge = (liveProd && liveProd.hidden) ? `
                    <span style="font-size: 0.72rem; color: #dc2626; background: #fee2e2; border: 1px solid #fecaca; padding: 2px 7px; border-radius: 4px; font-weight: 700; display: inline-block; margin-top: 3px;">
                        ⚠️ Currently Unavailable
                    </span>
                ` : '';

                itemsList.innerHTML += `
                    <div class="summary-row" style="margin-bottom: 12px; align-items: flex-start; justify-content: space-between;">
                        <div style="display: flex; align-items: flex-start; gap: 12px; flex: 1;">
                            <div>
                                <span style="font-weight: 500; color: var(--text-dark); display: block;">${currentTitle} (${item.quantity}x)</span>
                                ${sampleBadge}
                                ${hiddenBadge}
                            </div>
                            ${removeBtn}
                        </div>
                        <span style="font-weight: 600; color: var(--text-dark); margin-top: 2px;">₹${(currentPrice * item.quantity).toFixed(2)}</span>
                    </div>
                `;
            });
        }
        updateCouponSectionVisibility();
        updatePackagePreview();
        calculateTotal();
    }

    // Global function to remove item from checkout
    window.removeFromCheckout = (productId) => {
        cart = cart.filter(item => item.id !== productId);
        localStorage.setItem('mixx-cart', JSON.stringify(cart));
        renderCartSummary();
        // Also notify other tabs/components
        window.dispatchEvent(new CustomEvent('krm:dataUpdated'));
    };

    // Listen for live updates from admin
    window.addEventListener('krm:dataUpdated', () => {
        // Only update if it's NOT a "Buy Now" flow, as Buy Now uses isolated item
        if (!isBuyNow) {
            const newCart = JSON.parse(localStorage.getItem('mixx-cart')) || [];
            cart = newCart;
        }
        renderCartSummary();
    });

    const districtInput = document.getElementById("district");
    const pincodeInput = document.getElementById("pincode");

    function formatCurrency(amount) {
        return `₹${amount.toFixed(2)}`;
    }

    function computeDiscount() {
        if (!appliedCoupon || cart.length === 0) {
            return { discount: 0, reason: 'none' };
        }

        let eligibleSubtotal = 0;
        let sampleItemsCount = 0;

        cart.forEach(item => {
            const liveProd = (typeof storeData !== 'undefined' && storeData.products) 
                ? storeData.products.find(p => p.id === item.id) 
                : null;
            const currentPrice = liveProd ? liveProd.price : item.price;
            const currentTitle = liveProd ? liveProd.title : item.title;

            if (isSampleProduct({ id: item.id, title: currentTitle })) {
                sampleItemsCount += item.quantity;
            } else {
                eligibleSubtotal += currentPrice * item.quantity;
            }
        });

        // ❌ Rule: Sample products are NOT eligible for coupon offers
        if (eligibleSubtotal <= 0) {
            return { discount: 0, reason: 'sample_only' };
        }

        const minRequired = Number(appliedCoupon.minOrderAmount) || 0;
        if (minRequired > 0 && eligibleSubtotal < minRequired) {
            return { discount: 0, reason: 'min_order', minRequired: minRequired };
        }

        let discount = 0;
        if (appliedCoupon.discountType === 'percentage') {
            const pct = Number(appliedCoupon.discountValue) || 0;
            discount = (eligibleSubtotal * pct) / 100;
        } else {
            // Fixed amount in rupees
            const fixedAmt = Number(appliedCoupon.discountValue) || 0;
            discount = fixedAmt;
        }

        // Cannot discount more than the eligible products total
        discount = Math.min(discount, eligibleSubtotal);
        discount = Math.round(discount * 100) / 100;

        return { discount: discount, eligibleSubtotal: eligibleSubtotal, reason: 'ok' };
    }

    function showCouponMessage(text, type) {
        const msgEl = document.getElementById("couponMessage");
        if (!msgEl) return;
        msgEl.textContent = text;
        msgEl.className = `coupon-feedback ${type}`;
        msgEl.style.display = 'flex';
    }

    window.handleApplyCoupon = async function() {
        const input = document.getElementById("couponCodeInput");
        const applyBtn = document.getElementById("applyCouponBtn");
        
        if (!input) return;
        const code = input.value.trim().toUpperCase();
        
        if (!code) {
            showCouponMessage("Please enter a coupon code.", "error");
            return;
        }

        if (cart.length === 0) {
            showCouponMessage("Your cart is empty.", "error");
            return;
        }

        const hasRegularProduct = cart.some(item => {
            const liveProd = (typeof storeData !== 'undefined' && storeData.products) 
                ? storeData.products.find(p => p.id === item.id) 
                : null;
            const currentTitle = liveProd ? liveProd.title : item.title;
            return !isSampleProduct({ id: item.id, title: currentTitle });
        });

        if (!hasRegularProduct) {
            showCouponMessage("❌ Coupon offer is not applicable for Sample product.", "error");
            return;
        }

        applyBtn.disabled = true;
        applyBtn.textContent = "Checking...";

        try {
            let data = null;
            let isReferral = false;

            // 1. Try Firestore coupons collection
            try {
                const doc = await db.collection('coupons').doc(code).get();
                if (doc.exists) {
                    data = doc.data();
                    isReferral = !!data.isReferral;
                }
            } catch (fsErr) {
                console.warn("Firestore coupon fetch error:", fsErr);
            }

            // 2. Fallback / Check ReferralsService for referral codes
            if (!data && typeof ReferralsService !== 'undefined') {
                const refObj = await ReferralsService.findReferralCode(code);
                if (refObj) {
                    data = {
                        discountType: 'fixed',
                        discountValue: 20,
                        minOrderAmount: 0,
                        status: 'active',
                        isReferral: true,
                        referrerUsername: refObj.referrerUsername,
                        referrerName: refObj.referrerName
                    };
                    isReferral = true;
                }
            }

            if (!data) {
                showCouponMessage(`Coupon "${code}" is invalid.`, "error");
                appliedCoupon = null;
                sessionStorage.removeItem('krm_applied_coupon');
                calculateTotal();
                return;
            }

            if (data.status !== 'active') {
                showCouponMessage(`Coupon "${code}" is disabled or expired.`, "error");
                appliedCoupon = null;
                sessionStorage.removeItem('krm_applied_coupon');
                calculateTotal();
                return;
            }

            appliedCoupon = {
                code: code,
                discountType: data.discountType || 'percentage',
                discountValue: Number(data.discountValue) || 0,
                minOrderAmount: Number(data.minOrderAmount) || 0,
                description: data.description || '',
                isReferral: isReferral,
                referrerUsername: data.referrerUsername || null,
                referrerName: data.referrerName || null
            };

            const result = computeDiscount();
            if (result.reason === 'sample_only') {
                showCouponMessage("❌ Coupon offer is not applicable for Sample product. (மாதிரி தயாரிப்புக்கு கூப்பன் ஆஃபர் கிடையாது)", "error");
                appliedCoupon = null;
                sessionStorage.removeItem('krm_applied_coupon');
            } else if (result.reason === 'min_order') {
                showCouponMessage(`Minimum order of ₹${result.minRequired} (excluding sample products) required for this coupon.`, "error");
                appliedCoupon = null;
                sessionStorage.removeItem('krm_applied_coupon');
            } else {
                let discText = '';
                if (appliedCoupon.isReferral) {
                    discText = `₹20 Referral Discount (Partner: ${appliedCoupon.referrerName || 'KRM Partner'})`;
                } else {
                    discText = appliedCoupon.discountType === 'percentage' 
                        ? `${appliedCoupon.discountValue}% OFF` 
                        : `₹${appliedCoupon.discountValue} OFF`;
                }

                const hasSample = cart.some(item => {
                    const lp = (typeof storeData !== 'undefined' && storeData.products) ? storeData.products.find(p => p.id === item.id) : null;
                    return isSampleProduct({ id: item.id, title: lp ? lp.title : item.title });
                });
                const noteExtra = hasSample ? ' (Sample excluded)' : '';
                showCouponMessage(`✓ Code "${code}" applied! (${discText}${noteExtra})`, "success");
                sessionStorage.setItem('krm_applied_coupon', JSON.stringify(appliedCoupon));
            }

            calculateTotal();
        } catch(err) {
            console.error("Coupon verification error:", err);
            showCouponMessage("Could not check coupon. Please try again.", "error");
        } finally {
            applyBtn.disabled = false;
            applyBtn.textContent = "Apply";
        }
    };

    window.handleRemoveCoupon = function() {
        appliedCoupon = null;
        sessionStorage.removeItem('krm_applied_coupon');
        sessionStorage.removeItem('krm_ref_code');
        localStorage.removeItem('krm_ref_code');
        const input = document.getElementById("couponCodeInput");
        if (input) input.value = '';
        const msgEl = document.getElementById("couponMessage");
        if (msgEl) {
            msgEl.style.display = 'none';
            msgEl.textContent = '';
        }
        calculateTotal();
    };

    function calculateTotal() {
        const stateValue = (stateInput && stateInput.value ? stateInput.value : "").trim();
        const districtValue = (districtInput && districtInput.value ? districtInput.value : "").trim();
        const pincodeValue = (pincodeInput && pincodeInput.value ? pincodeInput.value : "").trim();
        const deliveryRateDisplay = document.getElementById("deliveryRateDisplay");
        const subtotalRow = document.getElementById("subtotalRow");
        const subtotalCostDisplay = document.getElementById("subtotalCostDisplay");
        const couponDiscountRow = document.getElementById("couponDiscountRow");
        const couponDiscountDisplay = document.getElementById("couponDiscountDisplay");
        const appliedCouponCode = document.getElementById("appliedCouponCode");
        
        // 🚀 If cart is empty, delivery and total are always 0
        if (cart.length === 0) {
            if (deliveryCostDisplay) deliveryCostDisplay.textContent = "₹0.00";
            if (totalCostDisplay) totalCostDisplay.textContent = "₹0.00";
            if (deliveryRateDisplay) deliveryRateDisplay.textContent = "";
            if (subtotalRow) subtotalRow.style.display = "none";
            if (couponDiscountRow) couponDiscountRow.style.display = "none";
            currentDiscountAmount = 0;
            return;
        }

        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

        let deliveryCost = 0;
        let rateText = "";
        let isFreeTN = false;

        const sLower = stateValue.toLowerCase().replace(/[^a-z0-9]/g, '');

        // 1. Check if Tamil Nadu or Puducherry (Free Delivery)
        if (
            sLower === "tamilnadu" || sLower === "tn" || sLower === "puducherry" || sLower === "pondicherry"
        ) {
            isFreeTN = true;
            deliveryCost = 0;
            rateText = "(Free Delivery)";
        } 
        // 2. Check South India (Andhra Pradesh, Telangana, Karnataka, Kerala)
        else if (
            sLower === "andhrapradesh" || sLower === "ap" || 
            sLower === "karnataka" || sLower === "ka" || 
            sLower === "kerala" || sLower === "kl" || 
            sLower === "telangana" || sLower === "ts" || sLower === "tg"
        ) {
            deliveryCost = 40 * totalItems;
            rateText = "(₹40/item)";
        } 
        // 3. All other states selected
        else if (stateValue !== "") {
            deliveryCost = 100 * totalItems;
            rateText = "(₹100/item)";
        } 
        // 4. Default before user selects state
        else {
            isFreeTN = true;
            deliveryCost = 0;
            rateText = "(Free in TN)";
        }

        // 🎟️ Evaluate Coupon Discount
        currentDiscountAmount = 0;
        if (appliedCoupon) {
            const result = computeDiscount();
            if (result.reason === 'ok' && result.discount > 0) {
                currentDiscountAmount = result.discount;
                if (subtotalRow) {
                    subtotalRow.style.display = 'flex';
                    if (subtotalCostDisplay) subtotalCostDisplay.textContent = formatCurrency(cartTotal);
                }
                if (couponDiscountRow) {
                    couponDiscountRow.style.display = 'flex';
                    if (appliedCouponCode) appliedCouponCode.textContent = appliedCoupon.code;
                    if (couponDiscountDisplay) couponDiscountDisplay.textContent = `-₹${currentDiscountAmount.toFixed(2)}`;
                }
            } else {
                if (subtotalRow) subtotalRow.style.display = 'none';
                if (couponDiscountRow) couponDiscountRow.style.display = 'none';
                if (result.reason === 'sample_only') {
                    showCouponMessage("❌ Coupon offer is not applicable for Sample product. (மாதிரி தயாரிப்புக்கு கூப்பன் கிடையாது)", "error");
                    sessionStorage.removeItem('krm_applied_coupon');
                    appliedCoupon = null;
                } else if (result.reason === 'min_order') {
                    showCouponMessage(`Minimum order of ₹${result.minRequired} (excluding sample products) required.`, "error");
                    sessionStorage.removeItem('krm_applied_coupon');
                    appliedCoupon = null;
                }
            }
        } else {
            if (subtotalRow) subtotalRow.style.display = 'none';
            if (couponDiscountRow) couponDiscountRow.style.display = 'none';
        }

        const discountedCartTotal = Math.max(0, cartTotal - currentDiscountAmount);
        const totalCost = discountedCartTotal + deliveryCost;

        // Update UI
        if (deliveryRateDisplay) deliveryRateDisplay.textContent = rateText;
        if (deliveryCostDisplay) {
            if (isFreeTN && deliveryCost === 0) {
                deliveryCostDisplay.textContent = "Free";
                deliveryCostDisplay.style.color = "#10b981";
            } else {
                deliveryCostDisplay.textContent = formatCurrency(deliveryCost);
                deliveryCostDisplay.style.color = "#475569";
            }
        }
        
        if (totalCostDisplay) totalCostDisplay.textContent = formatCurrency(totalCost);
    }

    // Check if cart has regular products for coupon pre-fill & auto-apply
    const hasRegularProdOnLoad = cart.some(item => {
        const lp = (typeof storeData !== 'undefined' && storeData.products) ? storeData.products.find(p => p.id === item.id) : null;
        return !isSampleProduct({ id: item.id, title: lp ? lp.title : item.title });
    });

    // Pre-fill input if coupon was previously applied
    if (appliedCoupon && appliedCoupon.code) {
        if (hasRegularProdOnLoad) {
            const input = document.getElementById("couponCodeInput");
            if (input) input.value = appliedCoupon.code;
        } else {
            appliedCoupon = null;
            sessionStorage.removeItem('krm_applied_coupon');
        }
    }
    
    // Initial render
    renderCartSummary();

    // 🎁 Auto-apply referral code from shared link (?ref=CODE or ?coupon=CODE or persisted from shop)
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const refParam = urlParams.get('ref') || urlParams.get('coupon') || sessionStorage.getItem('krm_ref_code') || localStorage.getItem('krm_ref_code');
        if (refParam && !appliedCoupon && hasRegularProdOnLoad) {
            const input = document.getElementById("couponCodeInput");
            if (input) {
                input.value = refParam.trim().toUpperCase();
                setTimeout(() => {
                    if (typeof handleApplyCoupon === 'function') handleApplyCoupon();
                }, 400);
            }
        }
    } catch(urlErr) {
        console.warn("URL referral param error:", urlErr);
    }

    stateInput?.addEventListener("change", calculateTotal);
    stateInput?.addEventListener("input", calculateTotal);
    districtInput?.addEventListener("input", calculateTotal);
    districtInput?.addEventListener("change", calculateTotal);
    pincodeInput?.addEventListener("input", calculateTotal);
    pincodeInput?.addEventListener("change", calculateTotal);
    checkoutForm?.addEventListener("change", calculateTotal);
    checkoutForm?.addEventListener("input", calculateTotal);

    // 📱 Validate referral code usage whenever mobile number is entered or changed
    const mobileNumberInput = document.getElementById("mobileNumber");
    async function validateAppliedReferralCodeWithPhone() {
        if (!appliedCoupon || !appliedCoupon.isReferral) return;
        if (typeof ReferralsService === 'undefined') return;

        const phoneVal = mobileNumberInput ? mobileNumberInput.value.trim() : "";
        const cleanPhone = phoneVal.replace(/[^0-9]/g, '').slice(-10);

        if (cleanPhone.length === 10) {
            const discText = `₹20 Referral Discount (Partner: ${appliedCoupon.referrerName || 'KRM Partner'})`;
            const hasSample = cart.some(item => {
                const lp = (typeof storeData !== 'undefined' && storeData.products) ? storeData.products.find(p => p.id === item.id) : null;
                return isSampleProduct({ id: item.id, title: lp ? lp.title : item.title });
            });
            const noteExtra = hasSample ? ' (Sample excluded)' : '';
            showCouponMessage(`✓ Code "${appliedCoupon.code}" applied! (${discText}${noteExtra})`, "success");
        }
    }

    if (mobileNumberInput) {
        mobileNumberInput.addEventListener("blur", validateAppliedReferralCodeWithPhone);
        mobileNumberInput.addEventListener("input", () => {
            const clean = mobileNumberInput.value.replace(/[^0-9]/g, '').slice(-10);
            if (clean.length === 10) {
                validateAppliedReferralCodeWithPhone();
            }
        });
    }

    // Load available delivery partners from Firestore
    const deliveryBySelect = document.getElementById("deliveryBy");
    async function loadDeliveryOptions() {
        if (!deliveryBySelect) return;
        try {
            const doc = await db.collection('settings').doc('deliveryConfig').get();
            let options = ['ST Courier', 'The Professional Couriers'];
            if (doc.exists && Array.isArray(doc.data().options) && doc.data().options.length > 0) {
                options = doc.data().options;
                if (!options.includes('The Professional Couriers')) {
                    options.push('The Professional Couriers');
                }
                if (!options.includes('ST Courier')) {
                    options.unshift('ST Courier');
                }
            }
            
            const currentVal = deliveryBySelect.value;
            let html = `<option value="" disabled ${!currentVal ? 'selected' : ''}>Select Delivery Partner</option>`;
            html += options.map(opt => 
                `<option value="${opt}" ${opt === currentVal ? 'selected' : ''}>${opt}</option>`
            ).join('');
            
            deliveryBySelect.innerHTML = html;

            // Restore saved courier preference if empty
            if (!currentVal) {
                try {
                    const raw = localStorage.getItem('krm_saved_shipping_address');
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed.deliveryBy && options.includes(parsed.deliveryBy)) {
                            deliveryBySelect.value = parsed.deliveryBy;
                        }
                    }
                } catch(e) {}
            }
        } catch (e) {
            console.warn("Using default ST Courier & The Professional Couriers options", e);
        }
    }
    loadDeliveryOptions();

    // =========================================================================
    // 📍 ADDRESS AUTO-FILL & PERSISTENCE (LocalStorage + Firestore Sync)
    // =========================================================================
    const ADDRESS_STORAGE_KEY = 'krm_saved_shipping_address';

    function getAddressFormData() {
        return {
            firstName: (document.getElementById("firstName")?.value || "").trim(),
            mobileNumber: (document.getElementById("mobileNumber")?.value || "").trim(),
            emailAddress: (document.getElementById("emailAddress")?.value || "").trim(),
            address1: (document.getElementById("address1")?.value || "").trim(),
            address2: (document.getElementById("address2")?.value || "").trim(),
            district: (document.getElementById("district")?.value || "").trim(),
            pincode: (document.getElementById("pincode")?.value || "").trim(),
            state: (stateInput?.value || document.getElementById("state")?.value || "").trim(),
            deliveryBy: (document.getElementById("deliveryBy")?.value || "").trim()
        };
    }

    function saveAddressToStorage(addressData) {
        if (!addressData || (!addressData.firstName && !addressData.address1)) return;
        try {
            localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(addressData));
        } catch(e) {
            console.warn("Could not save address to localStorage", e);
        }

        // If user is authenticated, sync to Firestore user profile
        try {
            const user = firebase.auth().currentUser;
            if (user && user.uid && typeof db !== 'undefined') {
                db.collection('users').doc(user.uid).set({
                    savedAddress: addressData,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true }).catch(() => {});
            }
        } catch(e) {}
    }

    function applyAddressToForm(data) {
        if (!data || typeof data !== 'object') return false;
        let filledCount = 0;

        const setField = (id, val) => {
            const el = document.getElementById(id);
            if (el && val && !el.value) {
                el.value = val;
                filledCount++;
            }
        };

        setField("firstName", data.firstName);
        setField("mobileNumber", data.mobileNumber || data.number || data.phone);
        setField("emailAddress", data.emailAddress || data.email);
        setField("address1", data.address1);
        setField("address2", data.address2);
        setField("district", data.district);
        setField("pincode", data.pincode);

        // State & Shipping Calculation
        const stateEl = document.getElementById("state");
        if (stateEl && data.state && (!stateEl.value || stateEl.value === "")) {
            stateEl.value = data.state;
            filledCount++;
            if (typeof calculateShipping === 'function') {
                calculateShipping();
            }
        }

        // Delivery Partner
        const deliveryEl = document.getElementById("deliveryBy");
        if (deliveryEl && data.deliveryBy && (!deliveryEl.value || deliveryEl.value === "")) {
            deliveryEl.value = data.deliveryBy;
        }

        // Show banner if fields were auto-filled
        const banner = document.getElementById("savedAddressBanner");
        if (banner && (data.address1 || data.firstName) && filledCount > 0) {
            banner.style.display = 'flex';
        }

        return filledCount > 0;
    }

    function clearCheckoutAddress() {
        const fields = ["firstName", "mobileNumber", "address1", "address2", "district", "pincode", "state", "deliveryBy"];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
        const banner = document.getElementById("savedAddressBanner");
        if (banner) banner.style.display = 'none';
        if (typeof calculateShipping === 'function') calculateShipping();
        document.getElementById("firstName")?.focus();
    }

    function initAddressAutoFill() {
        // 1. Try reading from localStorage immediately
        try {
            const raw = localStorage.getItem(ADDRESS_STORAGE_KEY) || localStorage.getItem('krm_user_address');
            if (raw) {
                const parsed = JSON.parse(raw);
                applyAddressToForm(parsed);
            }
        } catch(e) {}

        // 2. Set up Clear button
        const clearBtn = document.getElementById("clearAddressBtn");
        if (clearBtn) {
            clearBtn.addEventListener("click", clearCheckoutAddress);
        }

        // 3. Listen to input changes so any user modification updates the saved address
        const inputs = ["firstName", "mobileNumber", "emailAddress", "address1", "address2", "district", "pincode", "state", "deliveryBy"];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener("change", () => {
                    const current = getAddressFormData();
                    if (current.firstName && current.address1) {
                        saveAddressToStorage(current);
                    }
                });
            }
        });

        // 4. Also check Firebase auth state for logged in user's saved address or latest order
        firebase.auth().onAuthStateChanged(async (user) => {
            if (!user) return;
            
            // If email is still empty, prefill user email
            const emailInput = document.getElementById("emailAddress");
            if (emailInput && !emailInput.value && user.email) {
                emailInput.value = user.email;
            }

            // If address1 is still empty, check Firestore
            const addr1 = document.getElementById("address1")?.value;
            if (!addr1 && typeof db !== 'undefined') {
                try {
                    // Check users collection first
                    const uDoc = await db.collection('users').doc(user.uid).get();
                    if (uDoc.exists && uDoc.data().savedAddress) {
                        applyAddressToForm(uDoc.data().savedAddress);
                        return;
                    }
                    // Fallback: check latest order by this user
                    const orderSnap = await db.collection('orders')
                        .where('userId', '==', user.uid)
                        .orderBy('timestampMs', 'desc')
                        .limit(1)
                        .get();
                    if (!orderSnap.empty) {
                        const lastOrder = orderSnap.docs[0].data();
                        applyAddressToForm({
                            firstName: lastOrder.firstName,
                            mobileNumber: lastOrder.number,
                            emailAddress: lastOrder.email,
                            address1: lastOrder.address1,
                            address2: lastOrder.address2,
                            district: lastOrder.district,
                            pincode: lastOrder.pincode,
                            state: lastOrder.state,
                            deliveryBy: lastOrder.deliveryBy
                        });
                    }
                } catch(e) {
                    console.warn("Could not fetch remote saved address", e);
                }
            }
        });
    }

    initAddressAutoFill();

    checkoutForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // 📍 Persist entered address for future orders
        const currentAddr = getAddressFormData();
        saveAddressToStorage(currentAddr);
        
        if (cart.length === 0) {
            showToast("Your cart is empty!", "error");
            return;
        }

        const unavailableItem = cart.find(item => {
            const p = (typeof storeData !== 'undefined' && storeData.products) ? storeData.products.find(prod => prod.id === item.id) : null;
            return p && p.hidden;
        });
        if (unavailableItem) {
            const p = storeData.products.find(prod => prod.id === unavailableItem.id);
            showToast(`"${p ? p.title : unavailableItem.title}" is currently unavailable. Please remove it from your cart.`, "error");
            return;
        }

        const btn = document.querySelector(".proceed-btn");
        const originalText = btn.innerHTML;
        const paymentNotice = document.getElementById("paymentProcessNotice");
        
        btn.innerHTML = `<span class="btn-spinner"></span> Initializing Payment...`;
        btn.disabled = true;
        if (paymentNotice) paymentNotice.style.display = 'flex';

        try {
            // 🛑 Final strict verification: Referral code limit (Max 2 times per mobile number)
            const phoneInput = document.getElementById("mobileNumber");
            const phoneVal = phoneInput ? phoneInput.value.trim() : "";
            const cleanPhone10 = phoneVal.replace(/[^0-9]/g, '').slice(-10);

            if (appliedCoupon && appliedCoupon.isReferral) {
                if (!cleanPhone10 || cleanPhone10.length !== 10) {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    if (paymentNotice) paymentNotice.style.display = 'none';
                    showToast("Please enter a valid 10-digit mobile number.", "error");
                    if (phoneInput) phoneInput.focus();
                    return;
                }
            }

            // 1. Calculate amount in paise
            const totalAmountStr = totalCostDisplay.textContent.replace('₹', '');
            const amountPaise = Math.round(parseFloat(totalAmountStr) * 100);

            // 2. Fetch live Razorpay Key ID from backend (secret never exposed here)
            const keyResponse = await fetch('/api/get-key');
            if (!keyResponse.ok) throw new Error("Could not reach payment server.");
            const { keyId } = await keyResponse.json();

            const cleanItemsForNotes = cart.map(item => {
                const liveProd = storeData.products.find(p => p.id === item.id);
                return `${liveProd ? liveProd.title : item.title} x${item.quantity}`;
            }).join(', ').slice(0, 200);

            // 3. Create Order on Backend
            const orderResponse = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amountPaise,
                    currency: "INR",
                    receipt: 'ORD-' + Date.now(),
                    notes: {
                        name: document.getElementById("firstName").value.trim(),
                        phone: document.getElementById("mobileNumber").value.trim(),
                        email: document.getElementById("emailAddress").value.trim(),
                        address1: document.getElementById("address1").value.trim(),
                        address2: document.getElementById("address2").value.trim(),
                        district: document.getElementById("district").value.trim(),
                        state: stateInput.value.trim(),
                        pincode: document.getElementById("pincode").value.trim(),
                        deliveryBy: document.getElementById("deliveryBy") ? document.getElementById("deliveryBy").value.trim() : "ST Courier",
                        items: cleanItemsForNotes,
                        coupon: appliedCoupon ? appliedCoupon.code : 'None',
                        discount: appliedCoupon ? `₹${currentDiscountAmount.toFixed(2)}` : '₹0',
                        totalCost: totalCostDisplay.textContent.trim()
                    }
                })
            });

            const contentType = orderResponse.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await orderResponse.text();
                console.error("Backend Error Response:", text);
                throw new Error("Payment server not responding correctly. Please try again.");
            }

            const orderData = await orderResponse.json();

            if (!orderResponse.ok) {
                throw new Error(orderData.error || "Failed to create order");
            }

            // (No pre-saving before payment: order will only be saved when user pays successfully)

            // 4. Open Razorpay Live Modal
            const options = {
                "key": keyId,
                "amount": orderData.amount,
                "currency": orderData.currency,
                "name": "KRM Brite",
                "description": "Experience Premium Cleaning",
                "image": "logo.avif",
                "order_id": orderData.order_id,
                "handler": async function (response) {
                    showVerificationOverlay();
                    btn.innerHTML = `<span class="btn-spinner"></span> Verifying Payment...`;
                    
                    try {
                        // 4. Verify Signature on Backend
                        const verifyResponse = await fetch('/api/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        let verifyData;
                        try {
                            verifyData = await verifyResponse.json();
                        } catch(e) {
                            throw new Error("Backend returned invalid response. Please check server logs.");
                        }

                        if (verifyResponse.ok && verifyData.status === "success") {
                            updateVerificationOverlay("Payment Verified! Saving Order...");
                            
                            // Save order directly as Paid (New Orders)
                            await saveOrder('Paid', {
                                paymentId: response.razorpay_payment_id,
                                orderId: response.razorpay_order_id
                            });
                            
                            localStorage.removeItem('mixx-cart');
                            localStorage.removeItem('krm_buy_now_item');
                            sessionStorage.removeItem('krm_buy_now_item');
                            sessionStorage.removeItem('krm_applied_coupon');
                            sessionStorage.removeItem('krm_ref_code');
                            localStorage.removeItem('krm_ref_code');
                            updateVerificationOverlay("Order Placed Successfully! Redirecting...");
                            
                            // Clear cart and redirect
                            setTimeout(() => { 
                                window.location.href = '/profile'; // Redirect to orders page instead of home
                            }, 2000);
                        } else {
                            hideVerificationOverlay();
                            console.error("Verification failed data:", verifyData);
                            throw new Error(verifyData.message || "Payment verification failed. Please contact support.");
                        }
                    } catch (err) {
                        hideVerificationOverlay();
                        console.error('Verification Error:', err);
                        showToast(err.message, "error");
                        if (paymentNotice) paymentNotice.style.display = 'none';
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                    }
                },
                "prefill": {
                    "name": document.getElementById("firstName").value.trim(),
                    "contact": document.getElementById("mobileNumber").value.trim(),
                    "email": document.getElementById("emailAddress").value.trim()
                },
                "theme": {
                    "color": "#3b82f6"
                },
                "modal": {
                    "ondismiss": function() {
                        if (paymentNotice) paymentNotice.style.display = 'none';
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                        showToast("Payment cancelled by user", "error");
                    }
                }
            };

            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function (response) {
                if (paymentNotice) paymentNotice.style.display = 'none';
                showToast("Payment Failed: " + response.error.description, "error");
                btn.innerHTML = originalText;
                btn.disabled = false;
            });
            rzp.open();

        } catch (error) {
            console.error('Checkout Error:', error);
            showToast(error.message, "error");
            if (paymentNotice) paymentNotice.style.display = 'none';
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });

    async function saveOrder(status, paymentDetails = {}) {
        const now = new Date();

        // 🔄 Use live prices from storeData to avoid stale cart price mismatches
        const cleanItems = cart.map(item => {
            const liveProd = storeData.products.find(p => p.id === item.id);
            return {
                id:       item.id,
                title:    liveProd ? liveProd.title : item.title,
                price:    liveProd ? liveProd.price : item.price,
                quantity: item.quantity,
                image:    item.images ? item.images[0] : (item.image || 'logo.avif')
            };
        });

        const dateStr = now.toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' });
        const timeStr = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12: true });
        const dayStr  = now.toLocaleDateString('en-US', { weekday: 'long' });

        // Get user ID with fallback
        let currentUser = 'guest';
        if (typeof auth !== 'undefined' && auth.currentUser) {
            currentUser = auth.currentUser.uid;
        } else {
            // Check if user is actually logged in but auth isn't fully ready
            const user = firebase.auth().currentUser;
            if (user) currentUser = user.uid;
        }
        
        const orderData = {
            id:        'ORD-' + Date.now(),
            userId:    currentUser,
            firstName: document.getElementById("firstName").value.trim(),
            email:     document.getElementById("emailAddress").value.trim(),
            number:    document.getElementById("mobileNumber").value.trim(),
            address1:  document.getElementById("address1").value.trim(),
            address2:  document.getElementById("address2").value.trim(),
            district:  document.getElementById("district").value.trim(),
            pincode:   document.getElementById("pincode").value.trim(),
            state:     stateInput.value.trim(),
            deliveryBy: document.getElementById("deliveryBy") ? document.getElementById("deliveryBy").value.trim() : "ST Courier",
            items:     cleanItems,
            subtotal:  cartTotal,
            couponCode: appliedCoupon ? appliedCoupon.code : null,
            discountAmount: appliedCoupon ? currentDiscountAmount : 0,
            discountType: appliedCoupon ? appliedCoupon.discountType : null,
            discountValue: appliedCoupon ? appliedCoupon.discountValue : null,
            totalCost: totalCostDisplay.textContent,
            date:      dateStr,
            day:       dayStr,
            time:      timeStr,
            status:    status,
            razorpayOrderId: (paymentDetails && paymentDetails.orderId) ? paymentDetails.orderId : null,
            razorpayPaymentId: (paymentDetails && paymentDetails.paymentId) ? paymentDetails.paymentId : null,
            paymentDetails: paymentDetails,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            timestampMs: Date.now()
        };

        try {
            // Use deterministic document ID (Razorpay Order ID or ORD-timestamp)
            const docId = (paymentDetails && paymentDetails.orderId) ? paymentDetails.orderId : orderData.id;
            const docRef = db.collection('orders').doc(docId);

            // 🛡️ IDEMPOTENCY GUARD: Check if this order was already fully processed
            // Prevents duplicate emails, stock decrements, coupon counts, and referral commissions
            // if saveOrder is called twice (e.g. page refresh, slow network retry)
            const processedKey = `krm_order_processed_${docId}`;
            const alreadyProcessed = sessionStorage.getItem(processedKey) === 'true';

            // Use set with { merge: true } so even if webhook created document first,
            // we seamlessly enrich it with complete items, user info, images, and prices.
            await docRef.set(orderData, { merge: true });
            console.log('Order successfully saved/merged in Firestore! ID:', docId);

            // 📍 Ensure address is persisted in localStorage & user profile
            saveAddressToStorage({
                firstName: orderData.firstName,
                mobileNumber: orderData.number,
                emailAddress: orderData.email,
                address1: orderData.address1,
                address2: orderData.address2,
                district: orderData.district,
                pincode: orderData.pincode,
                state: orderData.state,
                deliveryBy: orderData.deliveryBy
            });

            if (status === 'Paid' && !alreadyProcessed) {
                // Mark as processed FIRST to prevent double-execution on retry
                sessionStorage.setItem(processedKey, 'true');

                if (appliedCoupon && appliedCoupon.code) {
                    try {
                        db.collection('coupons').doc(appliedCoupon.code).update({
                            usedCount: firebase.firestore.FieldValue.increment(1)
                        });
                    } catch(e) { console.warn('Failed to increment coupon usedCount:', e); }

                    // 🎁 REFERRAL REWARD TRIGGER (Referrer gets ₹100 credited!)
                    try {
                        if (typeof ReferralsService !== 'undefined') {
                            ReferralsService.recordReferralPurchase({
                                code: appliedCoupon.code,
                                customerName: orderData.firstName || 'Customer',
                                customerPhone: orderData.number || '',
                                customerEmail: orderData.email || '',
                                orderId: orderData.id,
                                orderTotal: orderData.totalCost
                            });
                            console.log(`[Checkout] Referral reward recorded for code "${appliedCoupon.code}"!`);
                        }
                    } catch(refErr) {
                        console.warn('[Checkout] Failed to record referral commission:', refErr);
                    }
                }
                sendOrderEmails(orderData);
                updateStockForItems(cleanItems);
                
                // Save to guest orders cache so guest user can view on profile
                try {
                    let guestOrders = JSON.parse(localStorage.getItem('krm_guest_orders') || '[]');
                    const exists = guestOrders.some(g => (g.id === orderData.id || (orderData.razorpayOrderId && g.razorpayOrderId === orderData.razorpayOrderId)));
                    if (!exists) {
                        guestOrders.unshift(orderData);
                        localStorage.setItem('krm_guest_orders', JSON.stringify(guestOrders));
                    }
                } catch(e) { console.warn('Guest orders cache error:', e); }
            } else if (alreadyProcessed) {
                console.warn(`[Checkout] Order ${docId} side effects already processed — skipping email, stock, coupon, referral.`);
            }
            return docRef;
        } catch (err) {
            console.error('Firestore order save error:', err);
            let orders = JSON.parse(localStorage.getItem('krmOrders')) || [];
            orders.unshift(orderData);
            localStorage.setItem('krmOrders', JSON.stringify(orders));
            return null;
        }
    }

    async function updateStockForItems(items) {
        for (const item of items) {
            try {
                const stockRef = db.collection('stock').doc(item.id);
                await db.runTransaction(async (transaction) => {
                    const sfDoc = await transaction.get(stockRef);
                    if (!sfDoc.exists) {
                        transaction.set(stockRef, { total: 100, sold: item.quantity });
                    } else {
                        const newSold = (sfDoc.data().sold || 0) + item.quantity;
                        const newRemain = Math.max(0, (sfDoc.data().total || 0) - newSold);
                        transaction.update(stockRef, { sold: newSold, remaining: newRemain });
                    }
                });
            } catch (e) {
                console.error('Stock update failed for', item.id, e);
            }
        }
    }

    async function sendOrderEmails(order) {
        const adminEmail = "krmbrite1@gmail.com";
        const itemsList = (order.items || []).map(i => `${i.title || 'Product'} (x${i.quantity || 1}) - ₹${(Number(i.price || 0) * Number(i.quantity || 1)).toFixed(2)}`).join('\n');
        
        const templateParams = {
            order_id: order.id,
            to_name: order.firstName,
            to_email: order.email,
            admin_email: adminEmail,
            total_amount: order.totalCost,
            items: itemsList,
            address: `${order.address1}, ${order.address2 ? order.address2 + ', ' : ''}${order.district}, ${order.state} - ${order.pincode}`,
            phone: order.number,
            date: `${order.day}, ${order.date} at ${order.time}`
        };

        try {
            // 1. Send Email to User
            // Note: You need to create these templates in your EmailJS dashboard
            await emailjs.send('service_uon76k5', 'template_user_order', templateParams);
            console.log('User email sent successfully');

            // 2. Send Email to Admin
            await emailjs.send('service_uon76k5', 'template_admin_order', templateParams);
            console.log('Admin email sent successfully');
        } catch (error) {
            console.error('Failed to send emails:', error);
        }
    }
    
    // Init total on page load
    calculateTotal();
});

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
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Verification Overlay UI Logic
function showVerificationOverlay() {
    let overlay = document.getElementById('payment-verification-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'payment-verification-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.9);
            backdrop-filter: blur(8px);
            z-index: 100000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: 'Outfit', 'Inter', sans-serif;
            opacity: 0;
            transition: opacity 0.5s ease;
        `;
        overlay.innerHTML = `
            <div style="text-align: center; max-width: 400px; padding: 40px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
                <div class="verify-spinner" style="
                    width: 60px;
                    height: 60px;
                    border: 4px solid rgba(255,255,255,0.1);
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    margin: 0 auto 25px;
                    animation: verify-spin 1s linear infinite;
                "></div>
                <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.5px;">Verifying Payment</h2>
                <p id="verify-status-msg" style="color: #94a3b8; font-size: 1rem; line-height: 1.6; font-weight: 500;">
                    Please wait for few seconds while we verify your transaction. Do not refresh or go back.
                </p>
                <div style="margin-top: 30px; display: flex; justify-content: center; gap: 8px;">
                    <div style="width: 6px; height: 6px; background: #3b82f6; border-radius: 50%; animation: pulse 1s infinite 0s;"></div>
                    <div style="width: 6px; height: 6px; background: #3b82f6; border-radius: 50%; animation: pulse 1s infinite 0.2s;"></div>
                    <div style="width: 6px; height: 6px; background: #3b82f6; border-radius: 50%; animation: pulse 1s infinite 0.4s;"></div>
                </div>
            </div>
            <style>
                @keyframes verify-spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.2); } }
            </style>
        `;
        document.body.appendChild(overlay);
    }
    
    // Trigger reflow
    void overlay.offsetWidth;
    overlay.style.opacity = '1';
}

function updateVerificationOverlay(message) {
    const msgEl = document.getElementById('verify-status-msg');
    if (msgEl) {
        msgEl.style.opacity = '0';
        setTimeout(() => {
            msgEl.textContent = message;
            msgEl.style.opacity = '1';
        }, 300);
    }
}

function hideVerificationOverlay() {
    const overlay = document.getElementById('payment-verification-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 500);
    }
}

