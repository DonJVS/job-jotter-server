const express = require("express");
const { google } = require("googleapis");
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
} = require("../config.js");

const router = new express.Router();

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Route to initiate OAuth flow
router.get("/auth/google", (req, res) => {
  const scopes = ["https://www.googleapis.com/auth/calendar.readonly"];
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });
  res.redirect(authUrl);
});

// OAuth callback route
router.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.json({
      message: "Authentication successful!",
      tokens,
    });
  } catch (error) {
    console.error("Error during Google OAuth callback:", error);
    res.status(500).send("Authentication failed");
  }
});

module.exports = router;
