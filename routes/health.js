const express = require("express");
const db = require("../db"); // Your database connection
const router = express.Router();

// Health check route
router.get("/health", async (req, res) => {
  try {
    // Check database connectivity
    await db.query("SELECT 1");

    res.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: err.message,
    });
  }
});

module.exports = router;
