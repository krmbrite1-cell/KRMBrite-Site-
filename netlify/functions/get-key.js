exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Use environment variable if set, otherwise fallback to live key
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_Sjx650p4JEj9fo';

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ keyId })
  };
};
