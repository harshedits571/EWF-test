const axios = require('axios');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const admin = require('firebase-admin');
require('dotenv').config();

// ─── FIREBASE INITIALIZATION ───
let db = null;
function initFirebase() {
    if (admin.apps.length) {
        db = admin.firestore();
        return;
    }
    try {
        const keyRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (keyRaw && keyRaw.trim() !== '') {
            const fixedKey = keyRaw.replace(/\\n/g, '\n');
            const serviceAccount = JSON.parse(fixedKey);
            if (serviceAccount.private_key) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: serviceAccount.project_id
                });
            }
        }
        db = admin.firestore();
    } catch (err) {
        console.error("Firebase Init Error:", err.message);
    }
}
initFirebase();

// ─── UTILS ───
function generateSecureKey() {
    const bytes = crypto.randomBytes(16);
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let key = '';
    for (let i = 0; i < 16; i++) key += alphabet[bytes[i] % alphabet.length];
    return `${key.slice(0, 4)}-${key.slice(4, 8)}-${key.slice(8, 12)}-${key.slice(12, 16)}`;
}

function signKey(licenseKey, email) {
    const secret = process.env.LICENSE_HMAC_SECRET || 'ew-pro-license-secret-2026';
    return crypto.createHmac('sha256', secret).update(`${licenseKey}:${email.toLowerCase().trim()}`).digest('hex');
}

// ─── HELPER: Parse JSON Body ───
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

// ─── MAIN HANDLER ───
module.exports = async (req, res) => {
    // 1. Setup Response Helpers (Vercel provides these, but Netlify might not)
    if (!res.status) res.status = (code) => { res.statusCode = code; return res; };
    if (!res.json) res.json = (data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
    };

    // 2. Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // 3. Detect Route
    const fullUrl = req.url || '';
    const cleanPath = fullUrl.split('?')[0];
    
    // Support both /api/verify and /verify (Netlify vs Vercel)
    const isRoute = (target) => cleanPath.endsWith(target);

    try {
        const body = req.method === 'POST' ? await getBody(req) : {};

        // ─── ROUTE: Create Order ───
        if (isRoute('create-order') && req.method === 'POST') {
            const { currency, name, email, phone, amount } = body;
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
            return res.json({ payment_session_id: response.data.payment_session_id });
        }

        // ─── ROUTE: Verify Payment ───
        if (isRoute('verify-payment') && req.method === 'POST') {
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
                isVerified = true; // Fallback for manual/client success
            }
            return res.json({ verified: isVerified, amount: amountPaid, tier: tier });
        }

        // ─── ROUTE: Generate License ───
        if (isRoute('generate-license') && req.method === 'POST') {
            const { paymentId, email, name, tier } = body;
            if (!email) return res.status(400).json({ error: "Email is required" });

            const isSimulation = paymentId && paymentId.startsWith('pay_test_simulation');
            const licenseKey = isSimulation ? "SIM-" + generateSecureKey().slice(4) : generateSecureKey();
            const signature = signKey(licenseKey, email);

            if (db) {
                await db.collection('licenses').doc(licenseKey).set({
                    key: licenseKey,
                    email: email.toLowerCase().trim(),
                    name: name || '',
                    tier: tier || 'pro',
                    payment_id: paymentId || 'manual',
                    created_at: admin.firestore.FieldValue.serverTimestamp(),
                    signature: signature,
                    status: 'active'
                });
            }

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
            });

            await transporter.sendMail({
                from: `"Easy Workflow" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: `🔑 Your ${tier || 'Software'} License Key`,
                html: `<div style="font-family: sans-serif; background: #09090b; color: #fff; padding: 30px; border-radius: 12px; max-width: 600px;">
                    <h2 style="color: #a855f7;">Hey ${name || 'Creator'},</h2>
                    <p>Your license key has been generated successfully! 🎉</p>
                    <div style="background: #1a1a2e; padding: 20px; border-radius: 16px; border: 2px solid #7c3aed; text-align: center;">
                        <p style="font-size: 11px; color: #a78bfa; margin: 0;">🔑 LICENSE KEY</p>
                        <p style="font-family: monospace; font-size: 24px; font-weight: 800; letter-spacing: 4px;">${licenseKey}</p>
                    </div>
                    <p style="font-size: 14px; margin-top: 20px;">Use this key with your email <b>${email}</b> to activate the extension.</p>
                </div>`
            }).catch(e => console.error("Email Error:", e.message));

            return res.json({ success: true, licenseKey, email });
        }

        return res.status(404).json({ error: "Route not found", path: cleanPath });
    } catch (err) {
        console.error("API Error:", err.message);
        return res.status(500).json({ error: err.message });
    }
};
