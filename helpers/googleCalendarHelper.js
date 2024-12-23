const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const db = require("../db");

// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar'
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize(userId) {
  if (process.env.NODE_ENV === "production") {
    // Fetch tokens from DB
    const userTokensRes = await db.query(
      `SELECT google_access_token, 
              google_refresh_token, 
              google_token_expiry
       FROM users
       WHERE id = $1`,
      [userId]
    );

    const userTokens = userTokensRes.rows[0];
    if (!userTokens || !userTokens.google_access_token) {
      throw new Error("No stored Google tokens for this user.");
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: userTokens.google_access_token,
      refresh_token: userTokens.google_refresh_token,
      expiry_date: userTokens.google_token_expiry
    });

    // Check if access token expired
    if (Date.now() >= userTokens.google_token_expiry) {
      // Refresh the token
      const { credentials } = await oauth2Client.refreshAccessToken();
      // Merge the new refresh token only if present
      credentials.refresh_token = credentials.refresh_token || userTokens.google_refresh_token;

      await db.query(
        `UPDATE users
         SET google_access_token = $1,
             google_refresh_token = $2,
             google_token_expiry = $3
         WHERE id = $4`,
        [
          credentials.access_token,
          credentials.refresh_token,
          credentials.expiry_date,
          userId
        ]
      );

      oauth2Client.setCredentials(credentials);
    }

    return oauth2Client;
  } else {

    let client = await loadSavedCredentialsIfExist();
    if (client) {
      return client;
    }
    client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
      await saveCredentials(client);
    }
    return client;
  }
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: oneMonthAgo.toISOString(),
    maxResults: 50,
    singleEvents: true,
    orderBy: 'startTime',
  });
  const events = res.data.items;
  if (!events || events.length === 0) {
    console.log('No upcoming events found.');
    return;
  }
  if (process.env.NODE_ENV !== "test") {
    console.log("Upcoming 50 events:");
    events.map((event, i) => {
      const start = event.start.dateTime || event.start.date;
      console.log(`${event.id} - ${start} - ${event.summary}`);
    });
  }

  return res.data.items || [];
}

authorize().then(listEvents).catch(console.error);

module.exports = {
  authorize,
  listEvents,
  saveCredentials,
};