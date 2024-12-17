const axios = require("axios");

const BASE_URL = "https://your-production-domain.com"; // Replace with your production URL

async function runSmokeTests() {
  try {
    console.log("Running smoke tests...");

    // Health check endpoint
    console.log("Testing /health endpoint...");
    const healthRes = await axios.get(`${BASE_URL}/health`);
    if (healthRes.status === 200 && healthRes.data.status === "ok") {
      console.log("✅ Health check passed");
    } else {
      throw new Error("❌ Health check failed");
    }

    // Jobs endpoint
    console.log("Testing /api/jobs endpoint...");
    const jobsRes = await axios.get(`${BASE_URL}/api/jobs`);
    if (jobsRes.status === 200 && Array.isArray(jobsRes.data)) {
      console.log("✅ Jobs endpoint passed");
    } else {
      throw new Error("❌ Jobs endpoint failed");
    }

    console.log("All smoke tests passed successfully!");
  } catch (err) {
    console.error("Smoke tests failed:", err.message);
    process.exit(1); // Exit with failure code
  }
}

runSmokeTests();
