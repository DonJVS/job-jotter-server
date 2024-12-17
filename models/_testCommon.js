"use strict";

const bcrypt = require("bcrypt");
const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

const testApplicationIds = [];
const testInterviewIds = [];
const testReminderIds = [];

async function commonBeforeAll() {

  try {
    // Clear all tables and reset identities
    await db.query("TRUNCATE reminders, interviews, applications, users RESTART IDENTITY CASCADE");


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

    console.log("Applications inserted:", applications.rows);


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


    // Insert Reminders
    const reminders = await db.query(
      `
      INSERT INTO reminders (application_id, user_id, reminder_type, date, description)
      VALUES 
        ($1, 1, 'Follow-up', '2024-12-07', 'Send a follow-up email to TechCorp.'),
        ($2, 1, 'Interview', '2024-12-10', 'Prepare for DataSolutions panel interview.'),
        ($3, 2, 'Deadline', '2024-11-30', 'Submit coding challenge for InnovateInc.')
      RETURNING id
      `,
      [testApplicationIds[0], testApplicationIds[1], testApplicationIds[2]] 
    );
    testReminderIds.push(...reminders.rows.map((row) => row.id));

  } catch (err) {
    console.error("Error in commonBeforeAll:", err);
    throw err;
  }
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
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
