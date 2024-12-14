"use strict";

const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for interviews. */
class Interview {
  /** Add a new interview.
   *
   * Returns { id, application_id, date, time, location, notes }
   */
  static async add({ applicationId, date, time, location, notes }) {
    console.log("Inputs to add:", { applicationId, date, time, location, notes });
    if (!applicationId || !date || !time || !location) {
      throw new BadRequestError("Missing required fields for interview creation.");
    }
  
    const result = await db.query(
      `INSERT INTO interviews (application_id, date, time, location, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, application_id AS "applicationId", date, time, location, notes`,
      [applicationId, date, time, location, notes]
    );
  
    return result.rows[0];
  }

  /** Get interview by ID.
   *
   * Returns { id, applicationId, date, time, location, notes }
   * Throws NotFoundError if no interview is found.
   */
  static async get(id) {
    const result = await db.query(
      `SELECT i.id, i.date, i.time, i.location, i.notes, a.company
       FROM interviews i
       JOIN applications a ON i.application_id = a.id
       WHERE i.id = $1`,
      [id]
    );

    const interview = result.rows[0];

    if (!interview) throw new NotFoundError(`No interview found with id: ${id}`);

    return interview;
  }
  

    /** Find all interviews for a given user ID.
   *
   * Returns [{ id, applicationId, date, time, location, notes }, ...]
   */
  static async findAll(userId) {
    const result = await db.query(
      `SELECT i.id,
              i.application_id AS "applicationId",
              i.date,
              i.time,
              i.location,
              i.notes,
              a.company
       FROM interviews i
       JOIN applications a ON i.application_id = a.id
       WHERE a.user_id = $1`,
      [userId]
    );

    return result.rows;
  }

  /** Get all interviews for a specific application.
   *
   * Returns [{ id, date, time, location, notes }, ...]
   */
  static async findByApplication(applicationId) {
    const result = await db.query(
      `SELECT id, application_id AS "applicationId", date, time, location, notes
       FROM interviews
       WHERE application_id = $1`,
      [applicationId]
    );

    return result.rows;
  }

  /** Update an interview with `data`.
   *
   * Data can include: { date, time, location, notes }
   *
   * Returns { id, applicationId, date, time, location, notes }
   */
  static async update(interviewId, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      applicationId: "application_id", 
      date: "date",
      time: "time",
      location: "location",
      notes: "notes",
    });
  
    const idVarIdx = `$${values.length + 1}`;
  
    const querySql = `
      UPDATE interviews
      SET ${setCols}
      WHERE id = ${idVarIdx}
      RETURNING id,
                application_id AS "applicationId",
                date,
                time,
                location,
                notes`;
  
    const result = await db.query(querySql, [...values, interviewId]);
    const interview = result.rows[0];
  
    if (!interview) throw new NotFoundError(`No interview: ${interviewId}`);
  
    return interview;
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
