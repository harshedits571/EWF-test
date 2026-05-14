const axios = require('axios');
require('dotenv').config();

/**
 * SIMULATED TEST SCRIPT
 * This script attempts to call your local Netlify function to verify
 * that your .env settings (Firebase & Razorpay) are correct.
 * 
 * RUN: node scratch/test_license_flow.js
 */

async function testLocalFlow() {
    console.log('🚀 Starting Local License Flow Test...');
    
    // Check if .env is loaded
    if (!process.env.RAZORPAY_KEY_ID) {
        console.error('❌ Error: .env file not found or RAZORPAY_KEY_ID is missing.');
        return;
    }

    const testData = {
        paymentId: 'pay_test_simulation_' + Date.now(),
        method: 'razorpay',
        email: 'test@example.com',
        name: 'Test User',
        tier: 'projectmanager',
        sessionTs: Date.now().toString()
    };

    console.log('📡 Sending simulation request to local function...');
    
    try {
        // We call the function directly (assuming netlify dev is running on 8888)
        const response = await axios.post('http://localhost:8888/.netlify/functions/generate-license', testData);
        
        if (response.data.success) {
            console.log('✅ SUCCESS!');
            console.log('🔑 Generated Key:', response.data.licenseKey);
            console.log('📧 Sent to:', response.data.email);
        } else {
            console.error('❌ Failed:', response.data.error);
        }
    } catch (err) {
        if (err.code === 'ECONNREFUSED') {
            console.error('❌ Error: Local server not running at http://localhost:8888. Please run "netlify dev" first!');
        } else {
            const data = err.response?.data || {};
            console.error('❌ Error Status:', err.response?.status || 'Unknown');
            console.error('❌ Error Message:', data.error || err.message);
            if (data.details) console.error('🔍 Details:', data.details);
            if (data.stack) console.error('📜 Stack Trace:', data.stack);
            
            if ((data.error && data.error.includes('Firebase')) || err.response?.status === 500) {
                console.log('\n💡 TIP: Your .env file is likely missing valid credentials.');
                console.log('   Check that FIREBASE_SERVICE_ACCOUNT_KEY and RAZORPAY_KEY_SECRET are filled correctly.');
            }
        }
    }
}

testLocalFlow();
