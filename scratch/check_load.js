try {
    console.log("🔍 Checking if 'functions/generate-license.js' can load...");
    const fn = require('../functions/generate-license.js');
    console.log("✅ File loaded successfully!");
    console.log("🔍 Testing handler existence...");
    if (typeof fn.handler === 'function') {
        console.log("✅ Handler found!");
    } else {
        console.error("❌ Handler NOT found in exports.");
    }
} catch (err) {
    console.error("❌ CRITICAL ERROR during load:");
    console.error(err.stack);
}
