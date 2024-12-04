"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");

/** Related functions for reminders. */
class Reminder {
  /** Add a new reminder.
   *
   * Returns { id, user_id, reminder_type, date, description }
   */
  static async add({ userId, reminderType, date, description }) {
    const result = await db.query(
      `INSERT INTO reminders (user_id, reminder_type, date, description)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id AS "userId", reminder_type AS "reminderType", date, description`,
      [userId, reminderType, date, description]
    );

    return result.rows[0];
  }

  /** Get all reminders for a user.
   *
   * Returns [{ id, reminder_type, date, description }, ...]
   */
  static async findByUser(userId) {
    const result = await db.query(
      `SELECT id, reminder_type AS "reminderType", date, description
       FROM reminders
       WHERE user_id = $1`,
      [userId]
    );

    return result.rows;
  }

  /** Delete a reminder by id; returns undefined. */
  static async remove(id) {
    const result = await db.query(
      `DELETE FROM reminders
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (!result.rows[0]) throw new NotFoundError(`No reminder: ${id}`);
  }
}

module.exports = Reminder;
