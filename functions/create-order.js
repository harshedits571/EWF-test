const axios = require('axios');

// Security: Server-authoritative Pricing Registry
// These are FALLBACK values. The primary source is Firestore (set via Admin Dashboard).
const RZP_AMOUNTS = {
  basic: { INR: 100, USD: 2 },
  pro: { INR: 1500, USD: 18 },
  autocaptions: { INR: 800, USD: 10 }
};

// After-deadline amounts (fallback)
const RZP_AMOUNTS_DEADLINE = {
  basic: { INR: 100, USD: 2 },
  pro: { INR: 2000, USD: 24 },
  autocaptions: { INR: 800, USD: 10 }
};

const PRICE_DEADLINE = new Date('2026-03-20T23:59:59+05:30');

function isPastDeadline() {
  return new Date() > PRICE_DEADLINE;
}

// Fetch dynamic pricing from Firestore REST API (no firebase-admin SDK needed)
async function getFirestorePricing() {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) return null;

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/config/pricing`;
    const res = await axios.get(url, { timeout: 3000 });
    
    if (res.data && res.data.fields) {
      const fields = res.data.fields;
      const pricing = {};
      
      // Parse Firestore REST API format (values are wrapped in type objects)
      for (const [key, val] of Object.entries(fields)) {
        if (val.integerValue !== undefined) pricing[key] = parseInt(val.integerValue);
        else if (val.doubleValue !== undefined) pricing[key] = val.doubleValue;
      }
      
      return pricing;
    }
    return null;
    return null;
  } catch (err) {
    console.warn('[Firestore] Could not fetch pricing, using fallback:', err.message);
    return null;
  }
}

// Helper to fetch Coupon from Firestore via REST API
async function getFirestoreCoupon(projectId, promoCode) {
  if (!projectId || !promoCode) return null;
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/coupons/${promoCode}`;
    const res = await axios.get(url, { timeout: 3000 });
    
    if (res.data && res.data.fields) {
      if (res.data.fields.active && res.data.fields.active.booleanValue === false) return null; // Inactive
      if (res.data.fields.discountPercent && res.data.fields.discountPercent.integerValue) {
        return parseInt(res.data.fields.discountPercent.integerValue);
      }
    }
  } catch (err) {
    console.warn(`[Firestore] Could not fetch coupon ${promoCode}:`, err.message);
  }
  return null;
}

exports.handler = async (event, context) => {
  // 1. CORS Headers (Security)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const { tier, currency, name, email, phone, mode, promoCode } = JSON.parse(event.body);

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) {
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ error: "API Keys missing from Netlify settings. Please add CASHFREE_APP_ID and CASHFREE_SECRET_KEY." }) 
      };
    }

    // Try to load dynamic pricing from Firestore first
    let verifiedAmount;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const firestorePricing = await getFirestorePricing();
    
    if (firestorePricing) {
      // Use Firestore prices (format: basic_inr, pro_usd, etc.)
      const currKey = (currency || 'INR').toLowerCase();
      const priceKey = `${tier}_${currKey}`;
      verifiedAmount = firestorePricing[priceKey];
      console.log(`[Pricing] Using Firestore price: ${priceKey} = ${verifiedAmount}`);
    }

    // Fallback to hardcoded prices if Firestore didn't return a value
    if (!verifiedAmount) {
      const registry = isPastDeadline() ? RZP_AMOUNTS_DEADLINE : RZP_AMOUNTS;
      verifiedAmount = registry[tier]?.[currency || "INR"];
      console.log(`[Pricing] Using fallback price: ${tier}/${currency} = ${verifiedAmount}`);
    }

    // Apply Promo Code if valid
    let appliedDiscount = 0;
    if (promoCode && projectId) {
        const discountPercent = await getFirestoreCoupon(projectId, promoCode);
        if (discountPercent && discountPercent > 0 && discountPercent <= 100) {
            appliedDiscount = discountPercent;
            const multiplier = (100 - discountPercent) / 100;
            const originalAmt = verifiedAmount;
            verifiedAmount = Math.round(verifiedAmount * multiplier);
            console.log(`[Pricing] Applied promo ${promoCode}: ${discountPercent}% off (${originalAmt} -> ${verifiedAmount})`);
        }
    }

    if (!verifiedAmount) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid tier or currency selected." })
      };
    }

    // Determine Environment: Switch to production URL if mode is 'production'
    const isProduction = mode === 'production' || !secretKey.includes('test');
    const baseUrl = isProduction 
      ? "https://api.cashfree.com/pg/orders" 
      : "https://sandbox.cashfree.com/pg/orders";

    // Call Cashfree API
    const response = await axios.post(baseUrl, {
      order_id: "order_" + Date.now(),
      order_amount: verifiedAmount,
      order_currency: currency || "INR",
      customer_details: {
        customer_id: "user_" + Date.now(),
        customer_name: name,
        customer_email: email,
        customer_phone: phone
      }
    }, {
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json'
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ payment_session_id: response.data.payment_session_id }),
    };

  } catch (error) {
    console.error("Netlify Function Error:", error.response ? error.response.data : error.message);
    
    // Check for specific Cashfree validation errors
    const errorDetails = error.response ? error.response.data.message : error.message;
    const errorCode = error.response && error.response.data.code ? error.response.data.code : "";

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Failed to create payment session", 
        details: errorDetails,
        code: errorCode
      }),
    };
  }
};
