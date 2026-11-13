const crypto = require('crypto');

const FIRESTORE_PROJECT_ID = 'krm-brite-ecommerce';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;

/**
 * Helper to query Firestore orders collection by orderId
 */
async function findOrderDoc(orderId) {
  // Strategy 0: Direct Document Lookup by orderId (Instant & Deterministic)
  try {
    const directRes = await fetch(`${FIRESTORE_BASE_URL}/orders/${orderId}`);
    if (directRes.ok) {
      const doc = await directRes.json();
      if (doc && doc.fields) return doc;
    }
  } catch (err) {
    console.warn('Direct order lookup by docId failed:', err);
  }

  // Strategy 1: Check nested paymentDetails.orderId
  const query1 = {
    structuredQuery: {
      from: [{ collectionId: 'orders' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'paymentDetails.orderId' },
          op: 'EQUAL',
          value: { stringValue: orderId }
        }
      },
      limit: 1
    }
  };

  try {
    const res1 = await fetch(`${FIRESTORE_BASE_URL}:runQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query1)
    });
    const data1 = await res1.json();
    const found1 = Array.isArray(data1) ? data1.find(d => d.document) : null;
    if (found1 && found1.document) return found1.document;
  } catch (err) {
    console.warn('Query by paymentDetails.orderId failed:', err);
  }

  // Strategy 2: Check top-level razorpayOrderId
  const query2 = {
    structuredQuery: {
      from: [{ collectionId: 'orders' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'razorpayOrderId' },
          op: 'EQUAL',
          value: { stringValue: orderId }
        }
      },
      limit: 1
    }
  };

  try {
    const res2 = await fetch(`${FIRESTORE_BASE_URL}:runQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query2)
    });
    const data2 = await res2.json();
    const found2 = Array.isArray(data2) ? data2.find(d => d.document) : null;
    if (found2 && found2.document) return found2.document;
  } catch (err) {
    console.warn('Query by razorpayOrderId failed:', err);
  }

  return null;
}

/**
 * Send instant email notification to merchant using EmailJS REST API
 * (Ensures client always gets email even for mobile UPI or when Firestore is quota-limited)
 */
async function sendAdminNotification(orderData) {
  try {
    const templateParams = {
      order_id: orderData.id,
      customer_name: orderData.firstName || 'Customer',
      customer_email: orderData.email || 'N/A',
      customer_phone: orderData.number || 'N/A',
      customer_address: [orderData.address1, orderData.address2, orderData.district, orderData.state, orderData.pincode].filter(Boolean).join(', ') || 'N/A',
      order_date: `${orderData.day || ''}, ${orderData.date || ''} at ${orderData.time || ''}`,
      total_amount: orderData.totalCost || '₹0',
      items_list: orderData.itemsSummary || 'Order Items',
      delivery_by: orderData.deliveryBy || 'ST Courier',
      admin_email: 'krmbrite1@gmail.com'
    };

    const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: 'service_uon76k5',
        template_id: 'template_admin_order',
        user_id: 'AIk1aEspV_Ex5ds1V',
        template_params: templateParams
      })
    });
    console.log('Webhook admin notification status:', emailRes.status);
  } catch (err) {
    console.warn('Webhook email notification failed:', err);
  }
}

async function createOrderFromWebhook(orderId, paymentId, paymentEntity, orderEntity) {
  const notes = (paymentEntity && paymentEntity.notes) || (orderEntity && orderEntity.notes) || {};
  const now = new Date();
  // Use Indian Standard Time (Asia/Kolkata) so server time always matches Razorpay payment time
  const dateStr = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day:'2-digit', month:'2-digit', year:'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour:'2-digit', minute:'2-digit', hour12: true });
  const dayStr  = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long' });

  const totalPaise = (paymentEntity && paymentEntity.amount) || (orderEntity && orderEntity.amount) || 0;
  const totalCost = notes.totalCost || `₹${(totalPaise / 100).toFixed(2)}`;

  // Use the original ORD-timestamp receipt ID from order creation, or generate a full timestamp ID
  const receiptId = (orderEntity && orderEntity.receipt && String(orderEntity.receipt).startsWith('ORD-'))
    ? String(orderEntity.receipt)
    : ('ORD-' + Date.now());

  // Parse items from notes if present so items list is never empty in Firestore!
  const itemsList = [];
  if (notes.items) {
    const parts = String(notes.items).split(',');
    parts.forEach(p => {
      const trimmed = p.trim();
      if (!trimmed) return;
      const match = trimmed.match(/(.+?)(?:\s+x\s*(\d+))?$/i);
      const title = match && match[1] ? match[1].trim() : trimmed;
      const qty = match && match[2] ? parseInt(match[2], 10) : 1;
      itemsList.push({
        mapValue: {
          fields: {
            title: { stringValue: title },
            quantity: { integerValue: String(qty) },
            price: { doubleValue: 0 },
            image: { stringValue: 'logo.avif' }
          }
        }
      });
    });
  }

  // First check if the document already exists (frontend may have just saved it)
  const checkUrl = `${FIRESTORE_BASE_URL}/orders/${orderId}`;
  let existingDoc = null;
  try {
    const checkRes = await fetch(checkUrl);
    if (checkRes.ok) {
      const doc = await checkRes.json();
      if (doc && doc.fields) existingDoc = doc;
    }
  } catch (e) {
    console.warn('Pre-check for existing doc failed:', e);
  }

  // If the document already exists (frontend saved first), only update status-related fields
  // DO NOT overwrite id, firstName, number, items, etc. that the frontend set correctly
  if (existingDoc) {
    const isAlreadyPaid = existingDoc.fields?.status?.stringValue === 'Paid' || existingDoc.fields?.status?.stringValue === 'paid';
    const isAlreadyPrinted = existingDoc.fields?.isPrinted?.booleanValue === true;
    if (isAlreadyPaid || isAlreadyPrinted) {
      console.log(`Document ${orderId} already exists and is Paid/Printed. Preserving untouched.`);
      return existingDoc;
    }

    console.log(`Document ${orderId} already exists. Updating only status fields, preserving frontend data.`);
    const updateFields = ['status', 'paidAt', 'paymentMethod', 'razorpayPaymentId', 'razorpayOrderId'];
    const updateMask = updateFields.map(f => `updateMask.fieldPaths=${f}`).join('&');
    const patchUrl = `https://firestore.googleapis.com/v1/${existingDoc.name}?${updateMask}`;
    const patchBody = {
      fields: {
        status: { stringValue: 'Paid' },
        paidAt: { timestampValue: now.toISOString() },
        paymentMethod: { stringValue: 'Razorpay (Webhook Auto-Confirmed)' },
        razorpayPaymentId: { stringValue: paymentId || '' },
        razorpayOrderId: { stringValue: orderId }
      }
    };
    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patchBody)
    });
    if (!patchRes.ok) {
      const errText = await patchRes.text();
      throw new Error(`Firestore status-only patch failed (${patchRes.status}): ${errText}`);
    }
    return await patchRes.json();
  }

  // Document truly doesn't exist — create it with webhook data as fallback
  // Use the full ORD-timestamp ID for clean display and consistency
  const postBody = {
    fields: {
      id: { stringValue: receiptId },
      firstName: { stringValue: notes.name || paymentEntity?.description || 'Customer' },
      number: { stringValue: notes.phone || paymentEntity?.contact || '' },
      email: { stringValue: notes.email || paymentEntity?.email || '' },
      address1: { stringValue: notes.address1 || notes.address || '' },
      address2: { stringValue: notes.address2 || '' },
      district: { stringValue: notes.district || '' },
      state: { stringValue: notes.state || '' },
      pincode: { stringValue: notes.pincode || '' },
      deliveryBy: { stringValue: notes.deliveryBy || 'ST Courier' },
      totalCost: { stringValue: totalCost },
      status: { stringValue: 'Paid' },
      razorpayOrderId: { stringValue: orderId },
      razorpayPaymentId: { stringValue: paymentId || '' },
      createdAt: { timestampValue: now.toISOString() },
      paidAt: { timestampValue: now.toISOString() },
      date: { stringValue: dateStr },
      time: { stringValue: timeStr },
      day: { stringValue: dayStr },
      paymentMethod: { stringValue: 'Razorpay (Webhook Auto-Saved)' }
    }
  };

  if (itemsList.length > 0) {
    postBody.fields.items = {
      arrayValue: {
        values: itemsList
      }
    };
  }

  const updateFields = Object.keys(postBody.fields);
  const updateMask = updateFields.map(f => `updateMask.fieldPaths=${f}`).join('&');
  const createUrl = `${FIRESTORE_BASE_URL}/orders/${orderId}?${updateMask}`;

  let createdDoc = null;
  try {
    const res = await fetch(createUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postBody)
    });

    if (res.ok) {
      createdDoc = await res.json();
    } else {
      const errText = await res.text();
      console.warn(`Firestore create warning (${res.status}): ${errText}`);
    }
  } catch (err) {
    console.error('Firestore create error in webhook:', err);
  }

  // Always send email notification to merchant even if Firestore experiences quota limits!
  await sendAdminNotification({
    id: receiptId,
    firstName: notes.name || paymentEntity?.description || 'Customer',
    number: notes.phone || paymentEntity?.contact || '',
    email: notes.email || paymentEntity?.email || '',
    address1: notes.address1 || notes.address || '',
    address2: notes.address2 || '',
    district: notes.district || '',
    state: notes.state || '',
    pincode: notes.pincode || '',
    deliveryBy: notes.deliveryBy || 'ST Courier',
    totalCost: totalCost,
    date: dateStr,
    time: timeStr,
    day: dayStr,
    itemsSummary: notes.items || 'Products'
  });

  return createdDoc || { name: `orders/${orderId}`, fields: postBody.fields };
}

/**
 * Patch order document status to Paid in Firestore
 */
async function markOrderAsPaid(docName, paymentId) {
  const patchUrl = `https://firestore.googleapis.com/v1/${docName}?updateMask.fieldPaths=status&updateMask.fieldPaths=paidAt&updateMask.fieldPaths=paymentMethod&updateMask.fieldPaths=razorpayPaymentId`;
  
  const patchBody = {
    fields: {
      status: { stringValue: 'Paid' },
      paidAt: { timestampValue: new Date().toISOString() },
      paymentMethod: { stringValue: 'Razorpay (Webhook Auto-Confirmed)' },
      razorpayPaymentId: { stringValue: paymentId || '' }
    }
  };

  const res = await fetch(patchUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patchBody)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firestore patch failed (${res.status}): ${errText}`);
  }

  return await res.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Razorpay-Signature');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  const payload = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(rawBody || '{}');

  // 1. Verify Razorpay Webhook signature if secret configured
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'] || req.headers['X-Razorpay-Signature'];

  if (webhookSecret) {
    if (!signature) {
      console.error('Webhook error: Missing x-razorpay-signature header');
      return res.status(400).json({ error: 'Missing signature' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Webhook error: Invalid Razorpay signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }
  } else {
    console.warn('⚠️ RAZORPAY_WEBHOOK_SECRET is not set in Vercel Environment Variables. Signature check skipped.');
  }

  const eventName = payload.event;
  console.log(`🔔 Razorpay Webhook received event: ${eventName}`);

  // We care about payment.captured or order.paid
  if (eventName === 'payment.captured' || eventName === 'order.paid') {
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    const orderId = paymentEntity?.order_id || orderEntity?.id;
    const paymentId = paymentEntity?.id;

    if (!orderId) {
      console.warn('No order_id found in webhook payload. Ignored.');
      return res.status(200).json({ status: 'ignored', message: 'No order_id' });
    }

    console.log(`Processing Webhook for Order: ${orderId}, Payment: ${paymentId}`);

    try {
      const orderDoc = await findOrderDoc(orderId);

      if (!orderDoc) {
        // Wait briefly — the frontend may be saving right now after payment verification
        console.log(`Order ${orderId} not found yet. Waiting 4s for frontend save...`);
        await new Promise(r => setTimeout(r, 4000));

        // Re-check after waiting
        const orderDocRetry = await findOrderDoc(orderId);
        if (!orderDocRetry) {
          console.log(`Order ${orderId} still not found after retry. Creating from Webhook...`);
          const createdDoc = await createOrderFromWebhook(orderId, paymentId, paymentEntity, orderEntity);
          console.log(`🎉 SUCCESS: Order ${orderId} created as 'Paid' via Webhook!`);
          return res.status(200).json({ status: 'created_as_paid', orderId, paymentId, docName: createdDoc.name });
        }

        // Frontend saved it in the meantime — check if already marked Paid or Printed
        const retryStatus = orderDocRetry.fields?.status?.stringValue;
        const isPrintedRetry = orderDocRetry.fields?.isPrinted?.booleanValue === true;
        if (retryStatus === 'Paid' || retryStatus === 'paid' || isPrintedRetry) {
          console.log(`Order ${orderId} already Paid/Printed (frontend saved it). Nothing to do.`);
          return res.status(200).json({ status: 'already_paid_or_printed', orderId });
        }
        await markOrderAsPaid(orderDocRetry.name, paymentId);
        console.log(`🎉 SUCCESS: Order ${orderId} updated to 'Paid' after frontend save!`);
        return res.status(200).json({ status: 'updated_to_paid', orderId, paymentId });
      }

      const currentStatus = orderDoc.fields?.status?.stringValue;
      const isPrintedDoc = orderDoc.fields?.isPrinted?.booleanValue === true;
      console.log(`Current status in Firestore for ${orderId}: '${currentStatus}', isPrinted: ${isPrintedDoc}`);

      if (currentStatus === 'Paid' || currentStatus === 'paid' || isPrintedDoc) {
        console.log(`Order ${orderId} is already marked as Paid or Printed. Nothing to do.`);
        return res.status(200).json({ status: 'already_paid_or_printed', orderId });
      }

      // Update to 'Paid' — but do NOT overwrite id or other fields the frontend set
      await markOrderAsPaid(orderDoc.name, paymentId);
      console.log(`🎉 SUCCESS: Order ${orderId} updated to 'Paid' via Razorpay Webhook!`);

      return res.status(200).json({ status: 'updated_to_paid', orderId, paymentId });
    } catch (err) {
      console.error(`Error updating order ${orderId} in Firestore:`, err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Other events (e.g. payment.failed, etc.)
  return res.status(200).json({ status: 'ignored', event: eventName });
};

