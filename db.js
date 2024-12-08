"use strict";
/** Database setup for Job Jotter. */
const { Pool } = require("pg");
const { getDatabaseUri } = require("./config");

// Use a connection pool instead of a single client
const db = new Pool({
  connectionString: getDatabaseUri(),
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 2 seconds if connection could not be established
});

module.exports = db;

