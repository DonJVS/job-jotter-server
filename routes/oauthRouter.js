const express = require("express");
const { google } = require("googleapis");
const db = require("../db");
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
  const scopes = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar"
  ];
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt:"consent",
    scope: scopes,
  });
  res.redirect(authUrl);
});

// OAuth callback route
router.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;
  try {
    //Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const currentUserId = res.locals.user.id;
    // Persist tokens in the DB
    await db.query(
      `UPDATE users
       SET 
         google_access_token = $1,
         google_refresh_token = $2,
         google_token_expiry = $3
       WHERE id = $4`,
      [
        tokens.access_token,
        tokens.refresh_token,
        tokens.expiry_date, 
        currentUserId
      ]
    );
    // Redirect the user back to the client
    res.redirect("https://jobjotter.onrender.com");

  } catch (error) {
    console.error("Error during Google OAuth callback:", error);
    res.status(500).send("Authentication failed");
  }
});

module.exports = router;
