"use strict";

/** Shared config for application */

require("dotenv").config();
require("colors");

const SECRET_KEY = process.env.SECRET_KEY || "Secret_passwrd";

const PORT = +process.env.PORT || 5000;

// Google OAuth 2.0 configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "your-client-id-here";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "your-client-secret-here";
const GOOGLE_REDIRECT_URI =
  process.env.NODE_ENV === "production"
    ? process.env.GOOGLE_REDIRECT_URI || "https://yourdomain.com/auth/google/callback"
    : "http://localhost:5001/auth/google/callback";

function getDatabaseUri() {
  const uri =
    process.env.NODE_ENV === "test"
      ? process.env.TEST_DATABASE_URL || "job_jotter_test"
      : process.env.DATABASE_URL || "job_jotter";

  return uri;
}


const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

if (process.env.NODE_ENV !== "production") {
  console.log("Job Jotter Config:".green);
  console.log("SECRET_KEY:".yellow, SECRET_KEY);
  console.log("PORT:".yellow, PORT.toString());
  console.log("BCRYPT_WORK_FACTOR:".yellow, BCRYPT_WORK_FACTOR);
  console.log("Database:".yellow, getDatabaseUri());
  console.log("GOOGLE_CLIENT_ID:".yellow, GOOGLE_CLIENT_ID);
  console.log("GOOGLE_REDIRECT_URI:".yellow, GOOGLE_REDIRECT_URI);
  console.log("---");
}
module.exports = {
  SECRET_KEY,
  PORT,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
};

