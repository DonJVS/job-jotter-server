"use strict";

/** Shared config for application */

require("dotenv").config();
require("colors");

const SECRET_KEY = process.env.SECRET_KEY || "secret-dev";

const PORT = +process.env.PORT || 5000;

// Use development, test, or production database based on NODE_ENV
function getDatabaseUri() {
  const uri = process.env.NODE_ENV === "test"
    ? "job_jotter_test"
    : process.env.DATABASE_URL || "job_jotter";

  console.log("Resolved Database URI:".blue, uri); // Debugging
  return uri;
}

// Speed up bcrypt during tests; use higher work factor for production
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

console.log("Job Jotter Config:".green);
console.log("SECRET_KEY:".yellow, SECRET_KEY);
console.log("PORT:".yellow, PORT.toString());
console.log("BCRYPT_WORK_FACTOR:".yellow, BCRYPT_WORK_FACTOR);
console.log("Database:".yellow, getDatabaseUri());
console.log("---");

module.exports = {
  SECRET_KEY,
  PORT,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri,
};
