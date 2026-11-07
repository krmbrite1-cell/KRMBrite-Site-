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

async function createOrderFromWebhook(orderId, paymentId, paymentEntity, orderEntity) {
  const notes = (paymentEntity && paymentEntity.notes) || (orderEntity && orderEntity.notes) || {};
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12: true });
  const dayStr  = now.toLocaleDateString('en-US', { weekday: 'long' });

  const totalPaise = (paymentEntity && paymentEntity.amount) || (orderEntity && orderEntity.amount) || 0;
  const totalCost = notes.totalCost || `₹${(totalPaise / 100).toFixed(2)}`;

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
  // Use the Razorpay Order ID as the display Order ID too (so it's consistent)
  const createUrl = `${FIRESTORE_BASE_URL}/orders/${orderId}`;
  const postBody = {
    fields: {
      id: { stringValue: 'ORD-' + orderId.replace(/[^0-9]/g, '').slice(-13) },
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

  const res = await fetch(createUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postBody)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firestore create failed (${res.status}): ${errText}`);
  }

  return await res.json();
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

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Razorpay-Signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // 1. Verify Razorpay Webhook signature if secret configured
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = event.headers['x-razorpay-signature'] || event.headers['X-Razorpay-Signature'];

  if (webhookSecret) {
    if (!signature) {
      console.error('Webhook error: Missing x-razorpay-signature header');
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing signature' }) };
    }

    const rawBody = event.isBase64Encoded 
      ? Buffer.from(event.body, 'base64').toString('utf8') 
      : event.body;

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Webhook error: Invalid Razorpay signature');
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid signature' }) };
    }
  } else {
    console.warn('⚠️ RAZORPAY_WEBHOOK_SECRET is not set in Netlify Environment Variables. Signature check skipped.');
  }

  // 2. Parse event payload
  let payload;
  try {
    const rawBody = event.isBase64Encoded 
      ? Buffer.from(event.body, 'base64').toString('utf8') 
      : event.body;
    payload = JSON.parse(rawBody || '{}');
  } catch (err) {
    console.error('Webhook error: Invalid JSON body', err);
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
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
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'ignored', message: 'No order_id' }) };
    }

    console.log(`Processing Webhook for Order: ${orderId}, Payment: ${paymentId}`);

    try {
      const orderDoc = await findOrderDoc(orderId);

      if (!orderDoc) {
        // Wait briefly — the frontend may be saving right now after payment verification
        console.log(`Order ${orderId} not found yet. Waiting 2s for frontend save...`);
        await new Promise(r => setTimeout(r, 2000));

        // Re-check after waiting
        const orderDocRetry = await findOrderDoc(orderId);
        if (!orderDocRetry) {
          console.log(`Order ${orderId} still not found after retry. Creating from Webhook...`);
          const createdDoc = await createOrderFromWebhook(orderId, paymentId, paymentEntity, orderEntity);
          console.log(`🎉 SUCCESS: Order ${orderId} created as 'Paid' via Webhook!`);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ status: 'created_as_paid', orderId, paymentId, docName: createdDoc.name })
          };
        }

        // Frontend saved it in the meantime — just ensure it's marked Paid
        const retryStatus = orderDocRetry.fields?.status?.stringValue;
        if (retryStatus === 'Paid' || retryStatus === 'paid') {
          console.log(`Order ${orderId} already Paid (frontend saved it). Nothing to do.`);
          return { statusCode: 200, headers, body: JSON.stringify({ status: 'already_paid', orderId }) };
        }
        await markOrderAsPaid(orderDocRetry.name, paymentId);
        console.log(`🎉 SUCCESS: Order ${orderId} updated to 'Paid' after frontend save!`);
        return { statusCode: 200, headers, body: JSON.stringify({ status: 'updated_to_paid', orderId, paymentId }) };
      }

      const currentStatus = orderDoc.fields?.status?.stringValue;
      console.log(`Current status in Firestore for ${orderId}: '${currentStatus}'`);

      if (currentStatus === 'Paid' || currentStatus === 'paid') {
        console.log(`Order ${orderId} is already marked as Paid. Nothing to do.`);
        return { statusCode: 200, headers, body: JSON.stringify({ status: 'already_paid', orderId }) };
      }

      // Update to 'Paid' — but do NOT overwrite id or other fields the frontend set
      await markOrderAsPaid(orderDoc.name, paymentId);
      console.log(`🎉 SUCCESS: Order ${orderId} updated to 'Paid' via Razorpay Webhook!`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'updated_to_paid', orderId, paymentId })
      };
    } catch (err) {
      console.error(`Error updating order ${orderId} in Firestore:`, err);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  // Other events (e.g. payment.failed, etc.)
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ status: 'ignored', event: eventName })
  };
};
