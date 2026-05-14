/* === Cloudflare Worker Backend for Cashfree === 
   1. Go to https://dash.cloudflare.com/
   2. Create a new Worker
   3. Paste this code
   4. In the Worker Settings -> Variables, add:
      - CASHFREE_APP_ID
      - CASHFREE_SECRET_KEY
*/

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // You can restrict this to your domain later
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const { amount, name, email, phone } = await request.json();

      // Determine Environment
      const isProduction = !env.CASHFREE_SECRET_KEY.includes('test');
      const baseUrl = isProduction 
        ? "https://api.cashfree.com/pg/orders" 
        : "https://sandbox.cashfree.com/pg/orders";

      const cfResponse = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "x-client-id": env.CASHFREE_APP_ID,
          "x-client-secret": env.CASHFREE_SECRET_KEY,
          "x-api-version": "2023-08-01",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          order_id: "order_" + Date.now(),
          order_amount: amount,
          order_currency: "INR",
          customer_details: {
            customer_id: "user_" + Date.now(),
            customer_name: name,
            customer_email: email,
            customer_phone: phone
          }
        })
      });

      const data = await cfResponse.json();
      
      if (!cfResponse.ok) {
        return new Response(JSON.stringify({ error: data.message || "Cashfree Error" }), { 
          status: cfResponse.status, 
          headers: corsHeaders 
        });
      }

      return new Response(JSON.stringify({ payment_session_id: data.payment_session_id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }
};
