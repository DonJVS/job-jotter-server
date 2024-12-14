"use strict";

/** Shared config for application */

require("dotenv").config();
require("colors");

const JWT_SECRET = process.env.JWT_SECRET || "Secret_passwrd";

const PORT = +process.env.PORT || 5000;

// Google OAuth 2.0 configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "your-client-id-here";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "your-client-secret-here";
const GOOGLE_REDIRECT_URI =
  process.env.NODE_ENV === "production"
    ? process.env.GOOGLE_REDIRECT_URI || "https://yourdomain.com/auth/google/callback"
    : "http://localhost:5001/auth/google/callback";

// Use development, test, or production database based on NODE_ENV
function getDatabaseUri() {
  const uri =
    process.env.NODE_ENV === "test"
      ? process.env.TEST_DATABASE_URL || "job_jotter_test"
      : process.env.DATABASE_URL || "job_jotter";

  console.log("Resolved Database URI:".blue, uri); // Debugging
  return uri;
}

// Speed up bcrypt during tests; use higher work factor for production
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

console.log("Job Jotter Config:".green);
console.log("JWT_SECRET:".yellow, JWT_SECRET);
console.log("PORT:".yellow, PORT.toString());
console.log("BCRYPT_WORK_FACTOR:".yellow, BCRYPT_WORK_FACTOR);
console.log("Database:".yellow, getDatabaseUri());
console.log("GOOGLE_CLIENT_ID:".yellow, GOOGLE_CLIENT_ID);
console.log("GOOGLE_REDIRECT_URI:".yellow, GOOGLE_REDIRECT_URI);
console.log("---");

module.exports = {
  JWT_SECRET,
  PORT,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
};

