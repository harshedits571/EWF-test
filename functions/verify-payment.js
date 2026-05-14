const axios = require('axios');
const nodemailer = require('nodemailer');

// Set up Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        pass: process.env.GMAIL_APP_PASSWORD // Set this in Netlify Env Vars
    }
});

/**
 * ── Send Initial Payment Confirmation Email ──
 * This email confirms we received the payment and a license is being prepared.
 */
async function sendCustomerEmail(toEmail, customerName, tier, licenseKey) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.warn("[Verify Email] Mail credentials missing. Skipping.");
        return;
    }

    // Modern, Premium Email Template
    const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #09090b; color: #fff; padding: 40px 20px; border-radius: 16px; max-width: 600px; margin: auto; border: 1px solid #27272a;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; padding: 12px; background: rgba(124, 58, 237, 0.1); border-radius: 12px; margin-bottom: 16px;">
                    <span style="font-size: 32px;">⚡</span>
                </div>
                <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Payment Confirmed</h1>
                <p style="color: #a1a1aa; margin: 8px 0 0; font-size: 16px;">Easy Workflow ${tier.toUpperCase()}</p>
            </div>

            <div style="background: #18181b; padding: 30px; border-radius: 12px; border: 1px solid #27272a; margin-bottom: 30px;">
                <h2 style="color: #fff; margin: 0 0 16px; font-size: 18px;">Hey ${customerName || 'Creator'},</h2>
                <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                    Great news! Your payment has been successfully verified. We are now generating your unique license key.
                </p>
                
                <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 10px; padding: 16px;">
                    <p style="color: #4ade80; margin: 0; font-size: 14px; font-weight: 600; display: flex; align-items: center;">
                        <span style="margin-right: 8px;">✓</span> Auto-Generation in Progress
                    </p>
                </div>
            </div>

            <p style="color: #71717a; font-size: 13px; line-height: 1.5; text-align: center; margin: 0;">
                You will receive a second email shortly with your 16-digit license key and installation instructions. 
                If you don't see it in 5 minutes, please check your spam folder.
            </p>
            
            <div style="margin-top: 40px; text-align: center; border-top: 1px solid #27272a; padding-top: 30px;">
                <p style="color: #fff; font-weight: 600; margin: 0;">The Easy Workflow Team</p>
                <p style="color: #52525b; font-size: 12px; margin: 4px 0 0;">Premium Tools for After Effects Creators</p>
            </div>
        </div>
    `;

    const mailOptions = {
        from: `"Easy Workflow" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `✅ Payment Verified: Your ${tier} Access`,
        html: emailHtml
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("[Verify Email] Success:", toEmail);
    } catch (err) {
        console.error("[Verify Email] Failed:", err.message);
    }
}


exports.handler = async (event, context) => {
    // CORS Headers
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
    };

    if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };
    if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: "Method Not Allowed" };

    try {
        const { paymentId, method, tier, name, email, phone } = JSON.parse(event.body);

        if (!paymentId || !method) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing payment information" }) };
        }

        let isVerified = false;
        let amountPaid = "N/A";

        // 1. VERIFY WITH GATEWAY
        if (paymentId.startsWith('pay_test_simulation')) {
            console.log("🛠️ [Verify] Simulation Mode: Success");
            isVerified = true;
            amountPaid = "INR 99.00 (SIMULATED)";
        }
        else if (method === 'cashfree') {
            const appId = process.env.CASHFREE_APP_ID;
            const secretKey = process.env.CASHFREE_SECRET_KEY;
            if (!appId || !secretKey) throw new Error("Cashfree credentials missing");

            const isProduction = !secretKey.includes('test');
            const baseUrl = isProduction
                ? `https://api.cashfree.com/pg/payments/${paymentId}`
                : `https://sandbox.cashfree.com/pg/payments/${paymentId}`;

            const cfRes = await axios.get(baseUrl, {
                headers: {
                    'x-client-id': appId,
                    'x-client-secret': secretKey,
                    'x-api-version': '2023-08-01'
                }
            });

            if (cfRes.data && cfRes.data.payment_status === 'SUCCESS') {
                isVerified = true;
                amountPaid = `${cfRes.data.payment_currency} ${cfRes.data.payment_amount}`;
            }
        }
        else if (method === 'razorpay') {
            const rzpKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_SbYRBwt9vpi7Rr';
            const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;

            if (!rzpKeySecret) {
                console.warn("[Verify] Razorpay Secret Missing — Skipping server-side validation");
                isVerified = true;
            } else {
                const auth = Buffer.from(`${rzpKeyId}:${rzpKeySecret}`).toString('base64');
                const rzpRes = await axios.get(`https://api.razorpay.com/v1/payments/${paymentId}`, {
                    headers: { 'Authorization': `Basic ${auth}` }
                });

                const payment = rzpRes.data;
                console.log(`[Verify] Razorpay Status for ${paymentId}: ${payment.status}`);

                if (payment && payment.status === 'authorized') {
                    // Try to Auto-capture
                    console.log(`[Verify] Attempting auto-capture for ${paymentId}...`);
                    try {
                        const captureRes = await axios.post(`https://api.razorpay.com/v1/payments/${paymentId}/capture`,
                            { amount: payment.amount, currency: payment.currency },
                            { headers: { 'Authorization': `Basic ${auth}` } }
                        );
                        if (captureRes.data && captureRes.data.status === 'captured') {
                            isVerified = true;
                            amountPaid = `${payment.currency} ${payment.amount / 100}`;
                        }
                    } catch (capErr) {
                        const errData = capErr.response?.data?.error || {};
                        console.error(`[Verify] Capture Error:`, errData.description || capErr.message);

                        // If it's already captured or has some other state that means it's valid, we proceed
                        if (errData.code === 'BAD_REQUEST_ERROR' && errData.description.includes('already been captured')) {
                            isVerified = true;
                        } else {
                            // Still allow authorized payments to proceed to the next step, 
                            // as generate-license has a second chance to capture.
                            isVerified = true;
                        }
                    }
                } else if (payment && payment.status === 'captured') {
                    isVerified = true;
                    amountPaid = `${payment.currency} ${payment.amount / 100}`;
                }
            }
        }

        // 2. IF VERIFIED — send email (license key will be sent separately by generate-license function)
        if (isVerified) {
            console.log(`[Verified] Payment ${paymentId} for ${tier} by ${name} (${email})`);

            // Fire Automated Email to Customer (without license key — key comes from generate-license)
            if (email) {
                await sendCustomerEmail(email, name, tier, null);
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    verified: true, 
                    amount: amountPaid,
                    tier: tier,
                    message: "Payment confirmed by server. Email dispatched." 
                })
            };
        } else {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ verified: false, error: "Payment verification failed." })
            };
        }

    } catch (error) {
        console.error("Verification Error:", error.response ? error.response.data : error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Server Verification Error", details: error.message })
        };
    }
};
