"use strict";

/** Shared config for application */

require("dotenv").config();
require("colors");

const JWT_SECRET = process.env.JWT_SECRET || "Secret_passwrd";

const PORT = +process.env.PORT || 5000;

// Use development, test, or production database based on NODE_ENV
function getDatabaseUri() {
  const uri = (process.env.NODE_ENV === "test")
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
console.log("---");

module.exports = {
  JWT_SECRET,
  PORT,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri,
};
