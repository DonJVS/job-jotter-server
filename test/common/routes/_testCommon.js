"use strict";

const bcrypt = require("bcrypt");
const db = require("../../../db.js");
const { BCRYPT_WORK_FACTOR } = require("../../../config.js");
const { createToken } = require("../../../helpers/tokens.js");
const common = require("../_testCommon");


/** Common test setup for routes */
async function commonBeforeAllRoutes() {
  await common.commonBeforeAll();

  try {
    // Insert test users
    const hashedPasswords = await Promise.all([
      bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
      bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
    ]);

    const users = await db.query(
      `
      INSERT INTO users (username, password, first_name, last_name, email, is_admin)
      VALUES 
        ('john_doe', $1, 'John', 'Doe', 'john.doe@example.com', true),
        ('jane_smith', $2, 'Jane', 'Smith', 'jane.smith@example.com', false)
      RETURNING id, username, is_admin AS "isAdmin"
      `,
      hashedPasswords
    );

    // Generate tokens for test users
    users.rows.forEach((user) => {
      common.testUserTokens[user.username] = createToken({ id: user.id, username: user.username, isAdmin: user.isAdmin });
    });

    // Add admin token specifically for ease of access
    common.testUserTokens.admin = createToken({
      id: users.rows[0].id, // Assuming first user is the admin
      username: users.rows[0].username,
      isAdmin: true,
    });

    // Insert applications
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
    common.testApplicationIds.push(...applications.rows.map((r) => r.id));

    // Insert interviews
    const interviews = await db.query(
      `
      INSERT INTO interviews (application_id, date, time, location, notes)
      VALUES 
        ($1, '2024-12-05', '10:00:00', '123 Main St, New York, NY', 'On-site technical interview.'),
        ($2, '2024-12-10', '14:00:00', 'Virtual', 'Panel interview via Zoom.')
      RETURNING id
      `,
      [common.testApplicationIds[0], common.testApplicationIds[1]]
    );

    common.testInterviewIds.push(...interviews.rows.map((r) => r.id));

    // Insert reminders
    const reminders = await db.query(
      `
      INSERT INTO reminders (user_id, application_id, reminder_type, date, description)
      VALUES 
        (1, $1, 'Follow-up', '2024-12-07', 'Send a follow-up email to TechCorp.'),
        (1, $2, 'Interview', '2024-12-10', 'Prepare for DataSolutions panel interview.'),
        (2, $3, 'Deadline', '2024-11-30', 'Submit coding challenge for InnovateInc.')
      RETURNING id
      `,
      [common.testApplicationIds[0], common.testApplicationIds[1], common.testApplicationIds[2]]
    );
    common.testReminderIds.push(...reminders.rows.map((r) => r.id));

  } catch (err) {
    console.error("Error in commonBeforeAll:", err);
    throw err;
  }
}



module.exports = {
  commonBeforeAllRoutes, // Exported from shared _testCommon.js, overridden here
  commonBeforeEach: common.commonBeforeEach,
  commonAfterEach: common.commonAfterEach,
  commonAfterAll: common.commonAfterAll,
  testApplicationIds: common.testApplicationIds,
  testInterviewIds: common.testInterviewIds,
  testUserTokens: common.testUserTokens,   
  testReminderIds: common.testReminderIds,
};
