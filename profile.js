document.addEventListener('DOMContentLoaded', () => {
    // Inject mobile-friendly styles for order cards
    const style = document.createElement('style');
    style.innerHTML = `
        @media (max-width: 600px) {
            .order-card {
                padding: 16px !important;
            }
            .order-header {
                flex-direction: column !important;
                align-items: flex-start !important;
                gap: 12px !important;
            }
            .order-status {
                align-self: flex-start !important;
            }
            .order-footer {
                flex-direction: column !important;
                gap: 15px !important;
                align-items: stretch !important;
            }
        }
    `;
    document.head.appendChild(style);

    const profileHeader = document.getElementById('profileHeader');
    const ordersList = document.getElementById('ordersList');

    // Make sure Firebase Auth is ready
    auth.onAuthStateChanged(user => {
        if (user) {
            // Render user profile info
            profileHeader.innerHTML = `
                <img src="${user.photoURL || 'https://via.placeholder.com/80'}" class="profile-avatar" alt="Profile" style="${user.isAnonymous ? 'display:none;' : ''}">
                ${user.isAnonymous ? '<div style="width:80px;height:80px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:2.5rem; border:3px solid var(--border-color);">👤</div>' : ''}
                <div class="profile-info">
                    <h1>${user.isAnonymous ? 'Guest User' : (user.displayName || 'User')}</h1>
                    <p>${user.isAnonymous ? 'Anonymous Account' : (user.email || '')}</p>
                </div>
            `;
            
            fetchUserOrders(user.uid);
        } else {
            // Not logged in with Google: show guest orders if available
            const guestOrders = JSON.parse(localStorage.getItem('krm_guest_orders') || localStorage.getItem('krmOrders') || '[]');

            profileHeader.innerHTML = `
                <div style="width:80px;height:80px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:2.5rem;border:3px solid var(--border-color);">👤</div>
                <div class="profile-info">
                    <h1>Guest User</h1>
                    <p style="margin-top:4px;">Shopping as Guest &bull; <a href="/login" onclick="sessionStorage.setItem('redirect_after_login', '/profile')" style="color:var(--primary); font-weight:700; text-decoration:none;">Log in to sync Google account</a></p>
                </div>
            `;

            if (guestOrders && guestOrders.length > 0) {
                // Sort descending by timestamp
                guestOrders.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
                let html = guestOrders.map(order => generateOrderCard(order)).join('<div class="order-divider"></div>');
                ordersList.innerHTML = html;
            } else {
                ordersList.innerHTML = `
                    <div class="empty-orders">
                        <h3>No orders found</h3>
                        <p>You can browse products and order directly without logging in!</p>
                        <a href="./" class="btn" style="display:inline-block; margin-top:15px; text-decoration:none; padding:10px 20px; background:var(--primary); color:white; border-radius:8px;">Start Shopping</a>
                    </div>
                `;
            }
        }
    });

    function fetchUserOrders(uid) {
        // We will query without orderBy first to avoid missing index errors, then sort locally
        db.collection('orders')
          .where('userId', '==', uid)
          .get()
          .then(snapshot => {
              if (snapshot.empty) {
                  const guestOrders = JSON.parse(localStorage.getItem('krm_guest_orders') || localStorage.getItem('krmOrders') || '[]');
                  if (guestOrders && guestOrders.length > 0) {
                      // Deduplicate guest orders by razorpayOrderId or id
                      const dedupedGuest = [];
                      const seen = new Set();
                      for (const g of guestOrders) {
                          const k = g.razorpayOrderId || g.id;
                          if (!seen.has(k)) { seen.add(k); dedupedGuest.push(g); }
                      }
                      dedupedGuest.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
                      let html = dedupedGuest.map(order => generateOrderCard(order)).join('<div class="order-divider"></div>');
                      ordersList.innerHTML = html;
                  } else {
                      ordersList.innerHTML = `
                          <div class="empty-orders">
                              <h3>No orders found</h3>
                              <p>Looks like you haven't placed any orders yet.</p>
                              <a href="./" class="btn" style="display:inline-block; margin-top:15px; text-decoration:none; padding:10px 20px; background:var(--primary); color:white; border-radius:8px;">Start Shopping</a>
                          </div>
                      `;
                  }
                  return;
              }

              // Deduplicate Firestore orders for this user by razorpayOrderId or id
              const orderMap = new Map();
              for (const doc of snapshot.docs) {
                  const d = doc.data();
                  const key = d.razorpayOrderId || d.id || doc.id;
                  if (!orderMap.has(key)) {
                      orderMap.set(key, { firestoreId: doc.id, ...d });
                  } else {
                      const existing = orderMap.get(key);
                      const existingItems = Array.isArray(existing.items) && existing.items.length > 0;
                      const currentItems = Array.isArray(d.items) && d.items.length > 0;
                      if (!existingItems && currentItems) {
                          orderMap.set(key, { firestoreId: doc.id, ...d });
                      }
                  }
              }

              const orders = Array.from(orderMap.values());
              // Sort descending by timestamp
              orders.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));

              let html = orders.map(order => generateOrderCard(order)).join('<div class="order-divider"></div>');
              ordersList.innerHTML = html;
          })
          .catch(error => {
              console.error("Error fetching orders: ", error);
              ordersList.innerHTML = `<div class="empty-orders" style="color:red;">Error loading orders. Please contact support.</div>`;
          });
    }

    function generateOrderCard(order) {
        const items = order.items && order.items.length > 0 ? order.items : [];
        const itemsHtml = items.length > 0 ? items.map(item => {
            // Find image for older orders that might not have it saved
            let itemImg = item.image;
            if (!itemImg && typeof storeData !== 'undefined') {
                const p = storeData.products.find(prod => prod.id === item.id);
                if (p && p.images) itemImg = p.images[0];
            }
            if (!itemImg) itemImg = 'logo.avif'; // Final fallback

            const unitPrice = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 1;

            return `
                <div class="order-item">
                    <div class="oi-left">
                        <img src="${itemImg}" class="oi-img" alt="${item.title || 'Product'}">
                        <div class="oi-details">
                            <span class="oi-title">${item.title || 'Item'}</span>
                            <span class="oi-price">₹${unitPrice.toFixed(2)} each</span>
                        </div>
                    </div>
                    <span class="order-item-qty">x${quantity}</span>
                </div>
            `;
        }).join('') : `
            <div class="order-item" style="color:var(--text-muted); font-size:0.9rem;">
                <span>Ordered Item(s) Confirmed</span>
            </div>
        `;

        const status = (order.status || 'pending').toLowerCase();
        const statusClass = `status-${status}`;
        
        let statusLabel = order.status || 'Pending';
        if (status === 'paid') statusLabel = 'Order Placed';
        if (status === 'shipped') statusLabel = 'In Transit';

        // Relative Date Logic
        let dateLabel = `${order.day || ''} ${order.date}`;
        if (order.timestampMs) {
            const now = new Date();
            const orderDate = new Date(order.timestampMs);
            const diffMs = now - orderDate;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0 && now.getDate() === orderDate.getDate()) {
                dateLabel = `<span style="color:var(--primary); font-weight:800;">Ordered Today</span>`;
            } else if (diffDays === 1 || (diffDays === 0 && now.getDate() !== orderDate.getDate())) {
                dateLabel = `Ordered Yesterday`;
            } else if (diffDays < 7) {
                dateLabel = `Ordered ${diffDays} days ago`;
            }
        }

        let trackingHtml = `
            <div class="order-tracking" style="margin-bottom: 20px;">
                <div style="font-weight:700; color:var(--text-dark); margin-bottom:10px; display:flex; align-items:center; gap:8px;">
                    🚚 Track Your Order
                </div>
                ${order.trackingId ? `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(59,130,246,0.05); padding:14px 18px; border-radius:12px; border:1px solid rgba(59,130,246,0.15); flex-wrap:wrap; gap:12px;">
                        <div style="display:flex; align-items:flex-start; gap:12px; flex-wrap:wrap; flex:1; min-width:180px;">
                            <div>
                                <div style="font-size:0.8rem; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; font-weight:700; margin-bottom:4px;">Tracking AWB ID</div>
                                <div style="font-weight:800; color:var(--primary-dark); font-size:1.15rem; letter-spacing:1px; font-family:'Outfit', sans-serif;">${order.trackingId}</div>
                            </div>
                            <button onclick="copyTrackingId('${order.trackingId}', this)" style="background:#e0f2fe; color:var(--primary-dark); border:1px solid #bae6fd; border-radius:6px; padding:6px 14px; font-size:0.85rem; font-weight:700; display:flex; align-items:center; gap:6px; cursor:pointer; transition:all 0.2s; margin-top:2px;" onmouseover="this.style.background='#bae6fd'" onmouseout="this.style.background='#e0f2fe'" title="Copy Tracking AWB ID">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                Copy
                            </button>
                        </div>
                        <div style="display:flex; flex-direction:column; align-items:center; gap:6px; flex:1; min-width:140px;">
                            <a href="${(order.deliveryBy || '').toLowerCase().includes('professional') ? 'https://www.tpcindia.com' : 'https://stcourier.com/track/shipment'}" target="_blank" style="background:linear-gradient(135deg, var(--primary), #8b5cf6); color:white; padding:10px 22px; border-radius:10px; text-decoration:none; font-weight:700; font-size:0.95rem; box-shadow:0 6px 16px rgba(59,130,246,0.25); transition:all 0.3s; display:block; white-space:nowrap; text-align:center; width:100%; box-sizing:border-box;">Track Now →</a>
                            <div style="font-size:0.75rem; color:#64748b; font-weight:700; text-align:center; text-transform:uppercase; letter-spacing:0.5px;">Delivered by ${order.deliveryBy || 'ST Courier'}</div>
                        </div>
                    </div>
                ` : `
                    <div style="background:#f8fafc; border:1px dashed #cbd5e1; padding:14px 18px; border-radius:12px; font-size:0.95rem; color:#64748b; font-weight:500;">
                        Your order details updates within 24 hours.
                    </div>
                `}
            </div>
        `;

        return `
            <div class="order-card" id="order-${order.firestoreId}">
                <div class="order-header">
                    <div>
                        <div class="order-id">#${order.id}</div>
                        <div class="order-date">${dateLabel} • ${order.time}</div>
                    </div>
                    <div class="order-status ${statusClass}">${statusLabel}</div>
                </div>
                <div class="order-items">
                    ${itemsHtml}
                </div>
                ${trackingHtml}
                <div class="order-footer">
                    <div>
                        <div class="order-total-lbl">Total Paid</div>
                        <div class="order-total-val">${order.totalCost}</div>
                    </div>
                </div>
            </div>
        `;
    }

    window.copyTrackingId = function(trackingId, btnEl) {
        navigator.clipboard.writeText(trackingId).then(() => {
            // UI Feedback on button
            if (btnEl) {
                const originalHtml = btnEl.innerHTML;
                btnEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!`;
                btnEl.style.background = '#dcfce7';
                btnEl.style.color = '#166534';
                btnEl.style.borderColor = '#bbf7d0';
                setTimeout(() => {
                    btnEl.innerHTML = originalHtml;
                    btnEl.style.background = '#e0f2fe';
                    btnEl.style.color = 'var(--primary-dark)';
                    btnEl.style.borderColor = '#bae6fd';
                }, 2000);
            }

            // Beautiful UI Toast popup
            showInlineToast('Tracking AWB ID Copied!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy Tracking ID');
        });
    };

    function showInlineToast(message) {
        let toast = document.getElementById('inline-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'inline-toast';
            toast.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#0f172a; color:white; padding:12px 24px; border-radius:50px; font-size:14px; font-weight:600; z-index:9999; opacity:0; transition:opacity 0.3s, bottom 0.3s; box-shadow:0 10px 25px rgba(0,0,0,0.2); display:flex; align-items:center; gap:8px; pointer-events:none;';
            document.body.appendChild(toast);
        }
        toast.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> ${message}`;
        
        // Trigger reflow for animation
        void toast.offsetWidth;
        
        toast.style.opacity = '1';
        toast.style.bottom = '40px';
        
        if (toast.hideTimeout) clearTimeout(toast.hideTimeout);
        toast.hideTimeout = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.bottom = '30px';
        }, 3000);
    }
});
