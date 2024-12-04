"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");

/** Related functions for interviews. */
class Interview {
  /** Add a new interview.
   *
   * Returns { id, application_id, date, time, location, notes }
   */
  static async add({ applicationId, date, time, location, notes }) {
    const result = await db.query(
      `INSERT INTO interviews (application_id, date, time, location, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, application_id AS "applicationId", date, time, location, notes`,
      [applicationId, date, time, location, notes]
    );

    return result.rows[0];
  }

  /** Get all interviews for a specific application.
   *
   * Returns [{ id, date, time, location, notes }, ...]
   */
  static async findByApplication(applicationId) {
    const result = await db.query(
      `SELECT id, date, time, location, notes
       FROM interviews
       WHERE application_id = $1`,
      [applicationId]
    );

    return result.rows;
  }

  /** Delete an interview by id; returns undefined. */
  static async remove(id) {
    const result = await db.query(
      `DELETE FROM interviews
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (!result.rows[0]) throw new NotFoundError(`No interview: ${id}`);
  }
}

module.exports = Interview;
