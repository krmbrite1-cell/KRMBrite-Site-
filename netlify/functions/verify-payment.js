const crypto = require('crypto');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  if (!keySecret) {
    console.error('Missing RAZORPAY_KEY_SECRET in environment variables');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Razorpay secret key not configured. Please add RAZORPAY_KEY_SECRET in Netlify Environment Variables.'
      })
    };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required payment verification parameters' })
      };
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'success',
          message: 'Payment verified successfully'
        })
      };
    } else {
      console.warn('Payment signature verification failed for order:', razorpay_order_id);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          status: 'failure',
          message: 'Invalid payment signature'
        })
      };
    }
  } catch (err) {
    console.error('Error verifying payment:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Payment verification failed' })
    };
  }
};
