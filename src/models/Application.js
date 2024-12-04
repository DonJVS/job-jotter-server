"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");

/** Related functions for applications. */
class Application {
  /** Add a new application.
   *
   * Returns { id, user_id, company, job_title, status, date_applied, notes }
   */
  static async add({ userId, company, jobTitle, status = "pending", notes }) {
    const result = await db.query(
      `INSERT INTO applications (user_id, company, job_title, status, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id AS "userId", company, job_title AS "jobTitle", status, notes`,
      [userId, company, jobTitle, status, notes]
    );

    return result.rows[0];
  }

  /** Get all applications for a user.
   *
   * Returns [{ id, company, job_title, status, date_applied, notes }, ...]
   */
  static async findByUser(userId) {
    const result = await db.query(
      `SELECT id, company, job_title AS "jobTitle", status, date_applied AS "dateApplied", notes
       FROM applications
       WHERE user_id = $1`,
      [userId]
    );

    return result.rows;
  }

  /** Delete an application by id; returns undefined. */
  static async remove(id) {
    const result = await db.query(
      `DELETE FROM applications
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (!result.rows[0]) throw new NotFoundError(`No application: ${id}`);
  }
}

module.exports = Application;
