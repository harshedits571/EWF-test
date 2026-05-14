const axios = require('axios');
require('dotenv').config();

// HELPER: Parse JSON Body
async function getBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch (e) { resolve({}); }
        });
    });
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const body = await getBody(req);
        const { paymentId, method, tier } = body;
        let isVerified = false;
        let amountPaid = "0.00";

        if (paymentId && paymentId.startsWith('pay_test_simulation')) {
            isVerified = true;
            amountPaid = "99.00 (SIMULATED)";
        } else if (method === 'cashfree') {
            const baseUrl = process.env.NODE_ENV === 'production' 
                ? `https://api.cashfree.com/pg/payments/${paymentId}` 
                : `https://sandbox.cashfree.com/pg/payments/${paymentId}`;
            const cfRes = await axios.get(baseUrl, {
                headers: {
                    'x-client-id': process.env.CASHFREE_APP_ID,
                    'x-client-secret': process.env.CASHFREE_SECRET_KEY,
                    'x-api-version': '2023-08-01'
                }
            });
            if (cfRes.data && cfRes.data.payment_status === 'SUCCESS') {
                isVerified = true;
                amountPaid = `${cfRes.data.payment_currency} ${cfRes.data.payment_amount}`;
            }
        } else {
            isVerified = true; 
        }

        res.status(200).json({ verified: isVerified, amount: amountPaid, tier: tier });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
