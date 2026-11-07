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

  const keyId = (process.env.RAZORPAY_KEY_ID || 'rzp_live_Sjx650p4JEj9fo').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  if (!keySecret) {
    console.error('Missing RAZORPAY_KEY_SECRET in environment variables');
    return res.status(500).json({
      error: 'Razorpay secret key not configured. Please add RAZORPAY_KEY_SECRET in Vercel Environment Variables.'
    });
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { amount, currency = 'INR', receipt, notes } = data;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount in paise is required' });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount)),
        currency: currency || 'INR',
        receipt: receipt || `ORD-${Date.now()}`,
        notes: notes || {}
      })
    });

    const rzpData = await rzpResponse.json();

    if (!rzpResponse.ok) {
      console.error('Razorpay API rejected order creation:', rzpData);
      const errorMsg = rzpData?.error?.description || rzpData?.error?.code || 'Failed to create Razorpay order';
      return res.status(rzpResponse.status).json({
        error: errorMsg,
        code: rzpData?.error?.code,
        details: rzpData?.error || null
      });
    }

    return res.status(200).json({
      order_id: rzpData.id,
      id: rzpData.id,
      amount: rzpData.amount,
      currency: rzpData.currency
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    return res.status(500).json({ error: err.message || 'Internal error creating Razorpay order' });
  }
};
