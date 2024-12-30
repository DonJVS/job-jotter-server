"use strict";

/** Shared config for application */

require("dotenv").config();
require("colors");

// Helper function to ensure critical environment variables are set
function ensureEnvVariable(varName) {
  const value = process.env[varName];
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Environment variable ${varName} is required in production.`);
    } else {
      console.warn(`Warning: Environment variable ${varName} is not set. Using fallback value.`.yellow);
    }
  }
  return value;
}

// Secure configuration
const SECRET_KEY = ensureEnvVariable("SECRET_KEY") || "your-secret-here";
const PORT = +process.env.PORT || 5000;

// Google OAuth 2.0 configuration
const GOOGLE_CLIENT_ID = ensureEnvVariable("GOOGLE_CLIENT_ID") || "your-client-id-here";
const GOOGLE_CLIENT_SECRET = ensureEnvVariable("GOOGLE_CLIENT_SECRET") || "your-client-secret-here";
const GOOGLE_REDIRECT_URI =
  process.env.NODE_ENV === "production"
    ? ensureEnvVariable("GOOGLE_REDIRECT_URI") || "https://yourdomain.com/auth/google/callback"
    : "http://localhost:5001/auth/google/callback";

function getDatabaseUri() {
  const uri =
    process.env.NODE_ENV === "test"
      ? ensureEnvVariable("TEST_DATABASE_URL") || "job_jotter_test"
      : ensureEnvVariable("DATABASE_URL") || "job_jotter";

  return uri;
}


const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

if (process.env.NODE_ENV !== "production") {
  const configDetails = {
    PORT: PORT.toString(),
    BCRYPT_WORK_FACTOR,
    DATABASE_URI: getDatabaseUri(),
    GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID ? "Configured" : "Not Configured",
    GOOGLE_REDIRECT_URI: GOOGLE_REDIRECT_URI ? "Configured" : "Not Configured",
  };

  console.log("Job Jotter Config:".green, JSON.stringify(configDetails, null, 2));
} else {
  console.log("Job Jotter running in production mode.".green);
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

