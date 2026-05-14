/**
 * ══════════════════════════════════════════════════════════════════════
 * 🔑 LICENSE RECOVERY — Netlify Serverless Function
 * ══════════════════════════════════════════════════════════════════════
 * 
 * This function allows users to retrieve their lost license keys by email.
 * It:
 *   1. Lookups the email in Firestore
 *   2. Finds the associated license(s)
 *   3. Resends the license details via email
 */

const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : null;

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: 'easy-workflow-pro'
        });
    } else {
        admin.initializeApp({
            projectId: 'easy-workflow-pro'
        });
    }
}

const db = admin.firestore();

// Set up Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

// 🚀 MAIN HANDLER
exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };

    try {
        const { email } = JSON.parse(event.body);
        if (!email) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email is required' }) };
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Check license_by_email collection first for quick lookup
        const emailRef = db.collection('license_by_email').doc(normalizedEmail);
        const emailDoc = await emailRef.get();

        if (!emailDoc.exists) {
            // 2. Fallback: Search the licenses collection directly (slower but thorough)
            const licenseSearch = await db.collection('licenses')
                .where('email', '==', normalizedEmail)
                .limit(5)
                .get();

            if (licenseSearch.empty) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'No license found for this email address.' })
                };
            }

            // Send all found licenses
            for (const doc of licenseSearch.docs) {
                const data = doc.data();
                await sendRecoveryEmail(normalizedEmail, data.name || 'Creator', data.product, data.licenseKey);
            }
        } else {
            // 3. Find the full details using the key from emailDoc
            const licenseData = emailDoc.data();
            const licenseKey = licenseData.licenseKey;
            
            // Get the full record for the name and product
            const fullLicense = await db.collection('licenses').doc(licenseKey.replace(/-/g, '')).get();
            const fullData = fullLicense.exists ? fullLicense.data() : licenseData;

            await sendRecoveryEmail(normalizedEmail, fullData.name || 'Creator', fullData.product, licenseKey);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'License details sent successfully.' })
        };

    } catch (error) {
        console.error('[Recovery Error]', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Server error. Please try again later.' })
        };
    }
};

async function sendRecoveryEmail(toEmail, customerName, product, licenseKey) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        throw new Error("Mail credentials missing on server");
    }

    const mailOptions = {
        from: `"Easy Workflow Support" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `🔑 Recovery: Your ${product} License Key`,
        html: `
            <div style="font-family: Arial, sans-serif; background: #09090b; color: #fff; padding: 30px; border-radius: 12px; max-width: 600px; margin: auto;">
                <h2 style="color: #06b6d4;">License Recovery</h2>
                <p style="font-size: 16px; color: #e5e5e5;">Hello ${customerName},</p>
                <p style="font-size: 14px; color: #e5e5e5;">We received a request to retrieve your license key for <strong>${product}</strong>. Here are your details:</p>
                
                <div style="background: linear-gradient(145deg, #1a1a2e, #111118); padding: 28px; border-radius: 16px; border: 2px solid rgba(6,182,212,0.3); margin: 24px 0; position: relative; overflow: hidden;">
                    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg, #06b6d4, #3b82f6);"></div>
                    <p style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #67e8f9; margin: 0 0 12px; text-transform: uppercase;">🔑 YOUR RECOVERED KEY</p>
                    <p style="font-family: 'Courier New', monospace; font-size: 26px; font-weight: 800; color: white; letter-spacing: 4px; margin: 0; padding: 12px 0; text-align: center;">${licenseKey}</p>
                    <p style="font-size: 12px; color: rgba(255,255,255,0.4); margin: 12px 0 0; text-align: center;">Used by: ${toEmail}</p>
                </div>
                
                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin: 16px 0;">
                    <p style="font-size: 13px; color: #e5e5e5; margin: 0; line-height: 1.6;">
                        <strong>Quick Activation:</strong><br>
                        1. Open the extension in After Effects.<br>
                        2. Use this email and the key above to unlock.<br>
                        3. One license works on 2 devices simultaneously.
                    </p>
                </div>
                
                <div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 24px;">
                    <p style="font-size: 12px; color: rgba(255,255,255,0.3); margin: 0;">If you didn't request this recovery, you can safely ignore this email.</p>
                </div>
                
                <p style="font-size: 16px; font-weight: bold; color: #fff; margin-top: 24px;">Need help?<br>Reply to this email.</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
}
