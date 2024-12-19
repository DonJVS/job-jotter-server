"use strict";

const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for applications. */
class Application {
  /** Add a new application.
   *
   * Returns { id, user_id, company, job_title, status, date_applied, notes }
   */
  static async add({ userId, company, jobTitle, status = "pending", dateApplied, notes }) {
    if (!userId || !company || !jobTitle || !status || !dateApplied) {
      throw new BadRequestError("Missing required fields for application creation.");
    }
    const result = await db.query(
        `INSERT INTO applications (user_id, company, job_title, status, date_applied, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, user_id AS "userId", company, job_title AS "jobTitle", status, date_applied AS "dateApplied", notes`,
        [userId, company, jobTitle, status, dateApplied, notes]
      );

      return result.rows[0];
    }

    /** Find all applications across all users.
   *
   * Returns [{ id, userId, company, jobTitle, status, dateApplied, notes }, ...]
   */
    static async findAll(userId = null) {
      let query = `
        SELECT id,
               user_id AS "userId",
               company,
               job_title AS "jobTitle",
               status,
               date_applied AS "dateApplied",
               notes
        FROM applications`;
      const values = [];
    
      if (userId !== null) {
        query += ` WHERE user_id = $1`;
        values.push(userId);
      }
    
      // Ensure consistent ordering
      query += ` ORDER BY date_applied DESC, id`;
    
      const result = await db.query(query, values);
    
      // Normalize dates to YYYY-MM-DD format
      return result.rows.map(app => ({
        ...app,
        dateApplied: app.dateApplied.toISOString().split("T")[0],
      }));
    }
    
  /** Get an application by id.
   *
   * Returns { id, userId, company, jobTitle, status, dateApplied, notes }
   * Throws NotFoundError if not found.
   */
  static async getWithDetails(id) {
    const result = await db.query(
      `SELECT id,
              user_id AS "userId",
              company,
              job_title AS "jobTitle",
              status,
              date_applied AS "dateApplied",
              notes
       FROM applications
       WHERE id = $1`,
      [id]
    );

    const application = result.rows[0];

    if (!application) throw new NotFoundError(`No application: ${id}`);

    const interviewsRes = await db.query(
      `SELECT id, 
              date, 
              time, 
              location, 
              notes 
       FROM interviews
       WHERE application_id = $1`,
      [id]
    );

    const remindersRes = await db.query(
      `SELECT id, 
              reminder_type AS "reminderType", 
              date, 
              description 
       FROM reminders
       WHERE user_id = $1`,
      [application.userId]
    );

    application.interviews = interviewsRes.rows;
    application.reminders = remindersRes.rows;

    return application;
  }

  /** Get all applications for a user.
   *
   * Returns [{ id, company, job_title, status, date_applied, notes }, ...]
   */
  static async findByUser(username) {
    const result = await db.query(
      `SELECT a.id, a.company, a.job_title AS "jobTitle", 
              a.status, a.date_applied AS "dateApplied", a.notes
       FROM applications a
       JOIN users u ON a.user_id = u.id
       WHERE u.username = $1`, // Use username directly as a string
      [username] // Pass username here
    );
  
    return result.rows;
  }
  

    /** Update an application.
   *
   * data can include: { company, jobTitle, status, dateApplied, notes }
   *
   * Returns { id, userId, company, jobTitle, status, dateApplied, notes }
   *
   */
  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      jobTitle: "job_title",
      dateApplied: "date_applied",
    });

    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE applications
      SET ${setCols}
      WHERE id = ${idVarIdx}
      RETURNING id, user_id AS "userId", company, job_title AS "jobTitle", status, date_applied AS "dateApplied", notes`;

    const result = await db.query(querySql, [...values, id]);

    const application = result.rows[0];

    if (!application) throw new NotFoundError(`No application: ${id}`);

    return application;
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
