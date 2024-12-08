"use strict";

const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");
const Reminder = require("./Reminder");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testReminderIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("add", function () {
  const newReminder = {
    userId: 1,
    reminderType: "Follow-up",
    date: "2024-12-15",
    description: "Follow up with TechCorp after interview.",
  };

  test("works", async function () {
    const reminder = await Reminder.add(newReminder);

    // Normalize `date` in the returned reminder for comparison
    const normalizedReminder = {
      ...reminder,
      date: new Date(reminder.date).toISOString().split("T")[0], // Convert to YYYY-MM-DD
    };

    expect(normalizedReminder).toEqual({
      id: expect.any(Number),
      ...newReminder,
    });

    const result = await db.query(
      `SELECT id, user_id AS "userId", reminder_type AS "reminderType", date, description
       FROM reminders
       WHERE id = $1`,
      [reminder.id]
    );

    expect(result.rows.length).toEqual(1);

    // Normalize `date` from the database for comparison
    const fetchedReminder = {
      ...result.rows[0],
      date: new Date(result.rows[0].date).toISOString().split("T")[0], // Convert to YYYY-MM-DD
    };

    expect(fetchedReminder).toEqual({
      id: reminder.id,
      userId: newReminder.userId,
      reminderType: newReminder.reminderType,
      date: newReminder.date,
      description: newReminder.description,
    });
  });

  test("throws BadRequestError with missing fields", async function () {
    try {
      await Reminder.add({
        userId: 1,
        reminderType: "Follow-up",
      });
      fail("Should not succeed");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

describe("get", function () {
  test("works", async function () {
    const reminder = await Reminder.get(testReminderIds[0]);

    // Normalize the date to YYYY-MM-DD
    const normalizedReminder = {
      ...reminder,
      date: reminder.date.toISOString().split("T")[0],
    };

    expect(normalizedReminder).toEqual({
      id: testReminderIds[0],
      userId: 1,
      reminderType: "Follow-up",
      date: "2024-12-07", // Normalized date format
      description: "Send a follow-up email to TechCorp.",
    });
  });

  test("throws NotFoundError if not found", async function () {
    try {
      await Reminder.get(0); // Non-existent ID
      fail("Should not succeed");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});


describe("findByUser", function () {
  test("works", async function () {
    const reminders = await Reminder.findByUser(1);

    // Normalize date fields to YYYY-MM-DD
    const normalizedReminders = reminders.map(reminder => ({
      ...reminder,
      date: reminder.date.toISOString().split("T")[0],
    }));

    expect(normalizedReminders).toEqual([
      {
        id: testReminderIds[0],
        userId: 1,
        reminderType: "Follow-up",
        date: "2024-12-07",
        description: "Send a follow-up email to TechCorp.",
      },
      {
        id: testReminderIds[1],
        userId: 1,
        reminderType: "Interview",
        date: "2024-12-10",
        description: "Prepare for DataSolutions panel interview.",
      },
    ]);
  });

  test("returns empty array if no reminders for user", async function () {
    const reminders = await Reminder.findByUser(999); // Non-existent user ID
    expect(reminders).toEqual([]);
  });
});


describe("update", function () {
  const updateData = {
    date: "2024-12-20",
    reminderType: "Updated Type",
    description: "Updated description",
  };

  test("works", async function () {
    const reminder = await Reminder.update(testReminderIds[0], updateData);

    // Normalize the date field
    const normalizedReminder = {
      ...reminder,
      date: reminder.date.toISOString().split("T")[0],
    };

    expect(normalizedReminder).toEqual({
      id: testReminderIds[0],
      userId: 1,
      ...updateData,
    });

    // Verify the update in the database
    const result = await db.query(
      `SELECT id, user_id AS "userId", reminder_type AS "reminderType", date, description
       FROM reminders
       WHERE id = $1`,
      [testReminderIds[0]]
    );

    const dbReminder = result.rows[0];
    const normalizedDbReminder = {
      ...dbReminder,
      date: dbReminder.date.toISOString().split("T")[0],
    };

    expect(normalizedDbReminder).toEqual({
      id: testReminderIds[0],
      userId: 1,
      reminderType: updateData.reminderType,
      date: updateData.date,
      description: updateData.description,
    });
  });

  test("not found if no such reminder", async function () {
    try {
      await Reminder.update(9999, updateData); // Non-existent ID
      fail("Should not succeed.");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("throws BadRequestError with no data", async function () {
    try {
      await Reminder.update(testReminderIds[0], {});
      fail("Should not succeed");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

describe("remove", function () {
  test("works", async function () {
    await Reminder.remove(testReminderIds[0]);
    const result = await db.query(
      `SELECT id FROM reminders WHERE id = $1`,
      [testReminderIds[0]]
    );
    expect(result.rows.length).toEqual(0);
  });

  test("throws NotFoundError if no such reminder", async function () {
    try {
      await Reminder.remove(99999); // Non-existent ID
      fail("Should not succeed");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
