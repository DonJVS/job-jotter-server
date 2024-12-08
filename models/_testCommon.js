"use strict";

const bcrypt = require("bcrypt");
const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

const testApplicationIds = [];
const testInterviewIds = [];
const testReminderIds = [];

async function commonBeforeAll() {
  console.log("Starting commonBeforeAll...");

  try {
    // Clear all tables and reset identities
    console.time("TRUNCATE Queries");
    await db.query("TRUNCATE reminders, interviews, applications, users RESTART IDENTITY CASCADE");
    console.timeEnd("TRUNCATE Queries");

    console.log("Inserting test data...");

    // Insert Users
    const hashedPasswords = await Promise.all([
      bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
      bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
    ]);

    await db.query(
      `
      INSERT INTO users (username, password, first_name, last_name, email, is_admin)
      VALUES 
        ('john_doe', $1, 'John', 'Doe', 'john.doe@example.com', true),
        ('jane_smith', $2, 'Jane', 'Smith', 'jane.smith@example.com', false)
      `,
      hashedPasswords
    );

    // Insert Applications
    const applications = await db.query(
      `
      INSERT INTO applications (user_id, company, job_title, status, date_applied, notes)
      VALUES 
        (1, 'TechCorp', 'Software Engineer', 'applied', '2024-11-01', 'Referred by a friend.'),
        (1, 'DataSolutions', 'Data Analyst', 'pending', '2024-11-15', 'Submitted online application.'),
        (2, 'InnovateInc', 'Frontend Developer', 'interviewed', '2024-10-20', 'Phone interview completed.')
      RETURNING id
      `
    );
    testApplicationIds.push(...applications.rows.map((row) => row.id));

    const result = await db.query("SELECT * FROM applications ORDER BY id");
    console.log("Applications in database:", result.rows);

    console.log("testApplicationIds after applications insert:", testApplicationIds);

    // Insert Interviews
    const interviews = await db.query(
      `
      INSERT INTO interviews (application_id, date, time, location, notes)
      VALUES 
        ($1, '2024-12-05', '10:00:00', '123 Main St, New York, NY', 'On-site technical interview.'),
        ($2, '2024-12-10', '14:00:00', 'Virtual', 'Panel interview via Zoom.')
      RETURNING id
      `,
      [testApplicationIds[2], testApplicationIds[1]]
    );
    testInterviewIds.push(...interviews.rows.map((row) => row.id));

    console.log("Inserted interview IDs:", testInterviewIds);

    // Insert Reminders
    const reminders = await db.query(
      `
      INSERT INTO reminders (user_id, reminder_type, date, description)
      VALUES 
        (1, 'Follow-up', '2024-12-07', 'Send a follow-up email to TechCorp.'),
        (1, 'Interview', '2024-12-10', 'Prepare for DataSolutions panel interview.'),
        (2, 'Deadline', '2024-11-30', 'Submit coding challenge for InnovateInc.')
      RETURNING id
      `
    );
    testReminderIds.push(...reminders.rows.map((row) => row.id));

    console.log("Test data successfully inserted.");
  } catch (err) {
    console.error("Error in commonBeforeAll:", err);
    throw err;
  }
}

async function commonBeforeEach() {
  console.time("commonBeforeEach");
  await db.query("BEGIN");
  console.timeEnd("commonBeforeEach");
}

async function commonAfterEach() {
  console.time("commonAfterEach");
  await db.query("ROLLBACK");
  console.timeEnd("commonAfterEach");
}

async function commonAfterAll() {
  console.log("Closing database connection...");
  await db.end();
  console.log("Database connection closed.");
}

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testApplicationIds,
  testInterviewIds,
  testReminderIds,
};