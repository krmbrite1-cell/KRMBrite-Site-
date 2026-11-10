module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_Sjx650p4JEj9fo';
  return res.status(200).json({ keyId });
};

