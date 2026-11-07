const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  if (!keySecret) {
    console.error('Missing RAZORPAY_KEY_SECRET in environment variables');
    return res.status(500).json({
      error: 'Razorpay secret key not configured. Please add RAZORPAY_KEY_SECRET in Vercel Environment Variables.'
    });
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required payment verification parameters' });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      return res.status(200).json({
        status: 'success',
        message: 'Payment verified successfully'
      });
    } else {
      console.warn('Payment signature verification failed for order:', razorpay_order_id);
      return res.status(400).json({
        status: 'failure',
        message: 'Invalid payment signature'
      });
    }
  } catch (err) {
    console.error('Error verifying payment:', err);
    return res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
};
