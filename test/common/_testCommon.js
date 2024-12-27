// test/common/_testCommon.js
"use strict";

const db = require("../../db.js");

const testUserTokens = {};
const testApplicationIds = [];
const testInterviewIds = [];
const testReminderIds = [];

/** Common test setup for all tests */
async function commonBeforeAll() {
  console.log("Starting commonBeforeAll...");

  try {
    // Clear all tables and reset identities
    await db.query("TRUNCATE reminders, interviews, applications, users RESTART IDENTITY CASCADE");
    console.log("Tables truncated successfully.");
  } catch (err) {
    console.error("Error truncating tables:", err);
    throw err;
  }
}

/** Common test setup before each test */
async function commonBeforeEach() {
  await db.query("BEGIN");
}

/** Common test teardown after each test */
async function commonAfterEach() {
  await db.query("ROLLBACK");
}

/** Common test teardown after all tests */
async function commonAfterAll() {
  try {
    await db.end();
  } catch (err) {
    console.error("Error closing database connection:", err);
  }
}

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testUserTokens,
  testApplicationIds,
  testInterviewIds,
  testReminderIds,
};
