const axios = require('axios');
require('dotenv').config();

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { currency, name, email, phone, amount } = req.body || {};
        const BASE_URL = process.env.NODE_ENV === 'production' ? "https://api.cashfree.com/pg/orders" : "https://sandbox.cashfree.com/pg/orders";
        
        const response = await axios.post(BASE_URL, {
            order_id: "order_" + Date.now(),
            order_amount: amount,
            order_currency: currency || "INR",
            customer_details: { customer_id: "cust_" + Date.now(), customer_name: name, customer_email: email, customer_phone: phone }
        }, {
            headers: {
                'x-client-id': process.env.CASHFREE_APP_ID,
                'x-client-secret': process.env.CASHFREE_SECRET_KEY,
                'x-api-version': '2023-08-01',
                'Content-Type': 'application/json'
            }
        });
        res.status(200).json({ payment_session_id: response.data.payment_session_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
