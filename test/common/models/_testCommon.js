"use strict";

const bcrypt = require("bcrypt");
const db = require("../../../db.js");
const { BCRYPT_WORK_FACTOR } = require("../../../config");
const common = require("../_testCommon");

async function commonBeforeAllModels() {
  await common.commonBeforeAll();

  try {

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
    common.testApplicationIds.push(...applications.rows.map((row) => row.id));



    // Insert Interviews
    const interviews = await db.query(
      `
      INSERT INTO interviews (application_id, date, time, location, notes)
      VALUES 
        ($1, '2024-12-05', '10:00:00', '123 Main St, New York, NY', 'On-site technical interview.'),
        ($2, '2024-12-10', '14:00:00', 'Virtual', 'Panel interview via Zoom.')
      RETURNING id
      `,
      [common.testApplicationIds[2], common.testApplicationIds[1]]
    );
    common.testInterviewIds.push(...interviews.rows.map((row) => row.id));


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
      [common.testApplicationIds[0], common.testApplicationIds[1], common.testApplicationIds[2]] 
    );
    common.testReminderIds.push(...reminders.rows.map((row) => row.id));

  } catch (err) {
    console.error("Error in commonBeforeAllModels:", err);
    throw err;
  }
}

module.exports = {
  commonBeforeAllModels, // Exported from shared _testCommon.js, overridden here
  commonBeforeEach: common.commonBeforeEach,
  commonAfterEach: common.commonAfterEach,
  commonAfterAll: common.commonAfterAll,
  testApplicationIds: common.testApplicationIds,
  testInterviewIds: common.testInterviewIds,
  testUserTokens: common.testUserTokens,   
  testReminderIds: common.testReminderIds,
};
