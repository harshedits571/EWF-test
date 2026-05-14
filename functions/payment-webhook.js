const axios = require('axios');

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
    const body = JSON.parse(event.body);
    console.log("🔔 Webhook Received:", body);

    // Identify Success (Works and checks for Cashfree & Razorpay)
    const isSuccess = body.event_type === "PAYMENT_SUCCESS" || 
                      body.event === "payment.captured" || 
                      body.txStatus === "SUCCESS";
    
    if (!isSuccess) return { statusCode: 200, headers, body: "Ignored (not success)" };

    // Get Customer Info
    const email = body.data?.customer_details?.customer_email || 
                  body.payload?.payment?.entity?.email || 
                  body.customerEmail;
    
    const name = body.data?.customer_details?.customer_name || 
                 body.payload?.payment?.entity?.notes?.name || "Customer";

    if (!email) throw new Error("No customer email found in webhook data.");

    // 1. GENERATE UNIQUE GUMROAD CODE
    const uniqueCode = "EW-PRO-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    // 2. CREATE GUMROAD OFFER (100% OFF, 1 USE)
    // Uses Netlify Environment Variables
    await axios.post(
      `https://api.gumroad.com/v2/products/${process.env.GUMROAD_PRODUCT_ID}/offers`,
      {
        name: `Licence for ${email}`,
        code: uniqueCode,
        amount_off: 10000, 
        max_uses: 1 
      },
      { headers: { 'Authorization': `Bearer ${process.env.GUMROAD_TOKEN}` } }
    );

    // 3. SEND THE EMAIL TO CUSTOMER (Using Resend)
    await axios.post(
      'https://api.resend.com/emails',
      {
        from: 'Easy Workflow <delivery@yourdomain.com>',
        to: [email],
        subject: '🎁 Your Easy Workflow Pro License Is Here!',
        html: `
          <h1>Hi ${name},</h1>
          <p>Your payment was successful! Your lifetime license code for Gumroad is:</p>
          <div style="background:#f4f4f4; padding:20px; text-align:center; border-radius:10px; border:2px dashed #7c3aed;">
            <h2 style="font-size:32px; color:#7c3aed; margin:0;">${uniqueCode}</h2>
          </div>
          <p><b>How to get your files:</b></p>
          <ol>
            <li>Go to our <a href="https://gumroad.com/l/${process.env.GUMROAD_PRODUCT_ID}">Gumroad Product Page</a>.</li>
            <li>Click "Buy This".</li>
            <li>Enter your code above in the "Discount" field.</li>
            <li>Price will become <b>₹0</b>. Complete the checkout to download!</li>
          </ol>
          <p>Happy creating!</p>
        `
      },
      { headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' } }
    );

    return { statusCode: 200, headers, body: "Automation Complete! Coupon Created and Emailed." };

  } catch (error) {
    console.error("❌ Webhook Error:", error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
