const { handler } = require('../functions/generate-license.js');

async function runLabTest() {
    console.log("🧪 Starting Lab Test (Bypassing Netlify Dev)...");
    
    const mockEvent = {
        httpMethod: 'POST',
        headers: { 'user-agent': 'LabTest' },
        body: JSON.stringify({
            paymentId: 'pay_test_simulation_123',
            method: 'razorpay',
            email: 'test@example.com',
            tier: 'Pro',
            name: 'Test User'
        })
    };

    try {
        console.log("📡 Calling handler directly...");
        const result = await handler(mockEvent);
        console.log("📥 Result Status:", result.statusCode);
        console.log("📥 Result Body:", JSON.parse(result.body));
    } catch (err) {
        console.error("💥 CRASH during handler execution:");
        console.error(err.stack);
    }
}

runLabTest();
