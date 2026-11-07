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

  const keyId = (process.env.RAZORPAY_KEY_ID || 'rzp_live_Sjx650p4JEj9fo').trim();
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
    const { amount, currency = 'INR', receipt, notes } = data;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Valid amount in paise is required' })
      };
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
      return {
        statusCode: rzpResponse.status,
        headers,
        body: JSON.stringify({
          error: errorMsg,
          code: rzpData?.error?.code,
          details: rzpData?.error || null
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        order_id: rzpData.id,
        id: rzpData.id,
        amount: rzpData.amount,
        currency: rzpData.currency
      })
    };
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal error creating Razorpay order' })
    };
  }
};
