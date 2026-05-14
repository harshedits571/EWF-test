const express = require('express');
const axios = require('axios');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const admin = require('firebase-admin');
require('dotenv').config();

const path = require('path');
const app = express();
app.use(express.json());
app.use(cors());

// Serve static files from the current working directory (root)
app.use(express.static(process.cwd()));

// Root route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

// ─── FIREBASE INITIALIZATION ───
let db = null;
function initFirebase() {
    if (admin.apps.length) {
        db = admin.firestore();
        return;
    }
    try {
        const keyRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        let serviceAccount = null;
        if (keyRaw && keyRaw.trim() !== '') {
            const fixedKey = keyRaw.replace(/\\n/g, '\n'); // Fix newlines for Vercel/Env
            serviceAccount = JSON.parse(fixedKey);
        }

        if (serviceAccount && serviceAccount.private_key) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id
            });
            console.log("✅ Firebase Admin initialized");
        } else {
            console.warn("⚠️ Firebase Service Account Key missing. Firestore features may fail.");
            // Optional: fallback to default if on GCP
            // admin.initializeApp({ projectId: 'easy-workflow-pro' });
        }
        db = admin.firestore();
    } catch (err) {
        console.error("❌ Firebase Init Error:", err.message);
    }
}
initFirebase();

// ─── UTILS ───
const LICENSE_LINKS = {
    basic: 'https://harshedits55.gumroad.com/l/Easyworkflow',
    pro: 'https://harshedits55.gumroad.com/l/Easyworkflowpro/lo8on3n',
    autocaptions: 'https://harshedits55.gumroad.com/l/Autocaptionpro'
};

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

// ─── API ROUTES ───

// 1. Create Order (Cashfree)
app.post(['/api/create-order', '/create-order'], async (req, res) => {
    try {
        const { tier, currency, name, email, phone, amount } = req.body;
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
        res.json({ payment_session_id: response.data.payment_session_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Verify Payment
app.post(['/api/verify-payment', '/verify-payment'], async (req, res) => {
    try {
        const { paymentId, method, tier, email } = req.body;
        let isVerified = false;
        let amountPaid = "0.00";

        // Simulation check
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
            isVerified = true; // Fallback for Razorpay client-side success
        }

        res.json({ verified: isVerified, amount: amountPaid, tier: tier });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Generate License & Store in Firestore
app.post(['/api/generate-license', '/generate-license'], async (req, res) => {
    try {
        const { paymentId, email, name, tier } = req.body;
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

        // ── SEND KEY EMAIL ──
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
        });

        await transporter.sendMail({
            from: `"Easy Workflow" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: `🔑 Your ${tier || 'Software'} License Key`,
            html: `
                <div style="font-family: sans-serif; background: #09090b; color: #fff; padding: 30px; border-radius: 12px; max-width: 600px;">
                    <h2 style="color: #a855f7;">Hey ${name || 'Creator'},</h2>
                    <p>Your license key has been generated successfully! 🎉</p>
                    <div style="background: #1a1a2e; padding: 20px; border-radius: 16px; border: 2px solid #7c3aed; text-align: center;">
                        <p style="font-size: 11px; color: #a78bfa; margin: 0;">🔑 LICENSE KEY</p>
                        <p style="font-family: monospace; font-size: 24px; font-weight: 800; letter-spacing: 4px;">${licenseKey}</p>
                    </div>
                    <p style="font-size: 14px; margin-top: 20px;">Use this key with your email <b>${email}</b> to activate the extension.</p>
                </div>
            `
        }).catch(e => console.error("Email Error:", e.message));

        res.json({ success: true, licenseKey, email, product: tier });
    } catch (err) {
        console.error("License Gen Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// For local testing
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

module.exports = app;
