const nodemailer = require('nodemailer');

// Set up Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

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
        const { email, name, tier, licenseLink, message } = JSON.parse(event.body);

        if (!email || !licenseLink) {
            return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: "Missing email or link" }) };
        }

        const mailOptions = {
            from: `"Easy Workflow Support" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: `🔥 Access Granted | Your ${tier ? tier.toUpperCase() : ''} Toolkit is Ready!`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { margin: 0; padding: 0; background-color: #050505; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
                        .wrapper { background-color: #050505; width: 100%; padding: 40px 0; }
                        .container { max-width: 600px; margin: 0 auto; background: #0c0c10; border: 1px solid #1a1a24; border-radius: 24px; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,0.8); }
                        .top-accent { height: 6px; background: linear-gradient(90deg, #7c3aed, #3b82f6, #06b6d4); }
                        .hero { padding: 50px 40px; text-align: center; background: radial-gradient(circle at top, rgba(124, 58, 237, 0.15) 0%, transparent 70%); }
                        .badge { display: inline-block; padding: 6px 12px; border-radius: 100px; background: rgba(124, 58, 237, 0.1); border: 1px solid rgba(124, 58, 237, 0.3); color: #a855f7; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
                        .h1 { color: #ffffff; font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
                        .content { padding: 0 50px 40px; }
                        .personal-note { background: #13131a; border-radius: 16px; padding: 24px; color: #e2e8f0; line-height: 1.7; font-size: 15px; border: 1px solid #1e1e2d; position: relative; }
                        .personal-note::after { content: '"'; position: absolute; top: -10px; right: 20px; font-size: 60px; color: rgba(124,58,237,0.2); font-family: serif; }
                        .roadmap { margin: 40px 0; border-left: 2px dashed #1e1e2d; margin-left: 20px; padding-left: 30px; }
                        .step { position: relative; margin-bottom: 30px; }
                        .step-dot { position: absolute; left: -41px; top: 0; width: 20px; height: 20px; border-radius: 50%; background: #0c0c10; border: 2px solid #7c3aed; }
                        .step-title { color: #ffffff; font-size: 16px; font-weight: 700; margin-bottom: 4px; }
                        .step-desc { color: #94a3b8; font-size: 13px; line-height: 1.5; }
                        .cta-area { text-align: center; padding: 20px 0 40px; }
                        .main-btn { display: inline-block; background: #ffffff; color: #000000 !important; padding: 20px 45px; border-radius: 14px; text-decoration: none; font-weight: 800; font-size: 18px; transition: transform 0.2s; box-shadow: 0 15px 35px rgba(255,255,255,0.1); }
                        .support-footer { background: #09090b; padding: 30px 50px; text-align: center; border-top: 1px solid #1a1a24; }
                        .support-text { color: #64748b; font-size: 13px; margin: 0; }
                        .brand { color: #ffffff; font-weight: 800; font-size: 18px; margin-top: 15px; display: block; }
                    </style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="container">
                            <div class="top-accent"></div>
                            <div class="hero">
                                <span class="badge">Payment Verified ✅</span>
                                <h1 class="h1">Access Granted.</h1>
                                <p style="color: #64748b; font-size: 16px; margin-top: 15px;">Welcome to the next level of After Effects efficiency.</p>
                            </div>

                            <div class="content">
                                <div class="personal-note">
                                    ${message || "Hi " + (name || 'Creator') + "! Thank you for choosing Easy Workflow. I've personally verified your payment and unlocked your pro toolkit below."}
                                </div>

                                <div class="roadmap">
                                    <div class="step">
                                        <div class="step-dot"></div>
                                        <div class="step-title">1. Open the Secure Link</div>
                                        <div class="step-desc">Click the white button below. It will open your personal access page on Gumroad.</div>
                                    </div>
                                    <div class="step">
                                        <div class="step-dot" style="border-color: #3b82f6;"></div>
                                        <div class="step-title">2. Claim for $0</div>
                                        <div class="step-desc">The 100% discount is pre-applied. If prompted for a price, simply enter 0 and click "Pay".</div>
                                    </div>
                                    <div class="step" style="margin-bottom: 0;">
                                        <div class="step-dot" style="border-color: #06b6d4;"></div>
                                        <div class="step-title">3. Download & Install</div>
                                        <div class="step-desc">You'll get instant access to the project files and the installation guide.</div>
                                    </div>
                                </div>

                                <div class="cta-area">
                                    <a href="${licenseLink}" class="main-btn">DOWNLOAD ACCESS →</a>
                                </div>
                            </div>

                            <div class="support-footer">
                                <p class="support-text">Having trouble with installation? Don't worry, we're here to help.</p>
                                <p class="support-text" style="margin-top: 8px;">Reply to this email or WhatsApp us anytime.</p>
                                <span class="brand">⚡ EASY WORKFLOW</span>
                                <p style="color: #334155; font-size: 11px; margin-top: 20px;">Order for: ${email} | Product: ${tier || 'Pro'}</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: "License email sent successfully." })
        };

    } catch (error) {
        console.error("Send License Error:", error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: "Server Error", details: error.message })
        };
    }
};
