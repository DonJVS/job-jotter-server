"use strict";

const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for reminders. */
class Reminder {
  /** Add a new reminder.
   *
   * Returns { id, user_id, reminder_type, date, description }
   */
  static async add({ userId, reminderType, date, description }) {
    if (!userId || !reminderType || !date || !description) {
      throw new BadRequestError("Missing required fields for reminder creation.");
    }

    const result = await db.query(
      `INSERT INTO reminders (user_id, reminder_type, date, description)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id AS "userId", reminder_type AS "reminderType", date, description`,
      [userId, reminderType, date, description]
    );

    return result.rows[0];
  }

    /** Find all reminders for a given user.
   *
   * Returns [{ id, userId, reminderType, date, description }, ...]
   */
  static async findAll(userId) {
    const result = await db.query(
      `SELECT id, user_id AS "userId", reminder_type AS "reminderType", date, description
       FROM reminders
       WHERE user_id = $1`,
      [userId]
    );

    return result.rows;
  }

  /** Get a reminder by ID.
   *
   * Returns { id, userId, reminderType, date, description }
   *
   * Throws NotFoundError if not found.
   */
  static async get(id) {
    const result = await db.query(
      `SELECT id, 
              user_id AS "userId", 
              reminder_type AS "reminderType", 
              date, 
              description
       FROM reminders
       WHERE id = $1`,
      [id]
    );

    const reminder = result.rows[0];

    if (!reminder) {
      throw new NotFoundError(`No reminder with ID: ${id}`);
    }

    return reminder;
  }

  /** Get all reminders for a user.
   *
   * Returns [{ id, reminder_type, date, description }, ...]
   */
  static async findByUser(userId) {
    const result = await db.query(
      `SELECT id, user_id AS "userId", reminder_type AS "reminderType", date, description
       FROM reminders
       WHERE user_id = $1`,
      [userId]
    );

    return result.rows;
  }

    /** Update a reminder with `data`.
   *
   * Data can include: { reminderType, date, description }
   *
   * Returns { id, userId, reminderType, date, description }
   *
   * Throws NotFoundError if the reminder does not exist.
   */
  static async update(reminderId, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      reminderType: "reminder_type",
    });

    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE reminders
      SET ${setCols}
      WHERE id = ${idVarIdx}
      RETURNING id, user_id AS "userId", reminder_type AS "reminderType", date, description`;

    const result = await db.query(querySql, [...values, reminderId]);
    const reminder = result.rows[0];

    if (!reminder) throw new NotFoundError(`No reminder: ${reminderId}`);

    return reminder;
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