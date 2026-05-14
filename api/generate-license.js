const crypto = require('crypto');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
require('dotenv').config();

// ─── FIREBASE INITIALIZATION ───
if (!admin.apps.length) {
    try {
        const keyRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (keyRaw) {
            const serviceAccount = JSON.parse(keyRaw.replace(/\\n/g, '\n'));
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id
            });
        }
    } catch (err) { console.error("Firebase Init Error:", err.message); }
}
const db = admin.apps.length ? admin.firestore() : null;

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

// ─── HANDLER ───
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { paymentId, email, name, tier } = req.body || {};
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
                </div>`
        }).catch(e => console.error("Email Error:", e.message));

        res.status(200).json({ success: true, licenseKey, email });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
