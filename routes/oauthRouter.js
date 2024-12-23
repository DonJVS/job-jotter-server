const express = require("express");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
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

  const userJwt = res.locals.user ? res.locals.user._rawToken : null; 

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt:"consent",
    scope: scopes,
    state: userJwt,
  });
  res.redirect(authUrl);
});

// OAuth callback route
router.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  try {
    // Decode the user from state
    const userPayload = jwt.verify(state, SECRET_KEY);
    //Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

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
        userPayload.id
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
