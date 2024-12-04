"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config.js");
const { NotFoundError, BadRequestError, UnauthorizedError } = require("../expressError");

/** Related functions for users. */
class User {
  /** Authenticate user with username, password.
   *
   * Returns { id, username, email, isAdmin }
   * Throws UnauthorizedError if user not found or wrong password.
   */
  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT id, username, password, email, is_admin AS "isAdmin"
       FROM users
       WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];
    if (user) {
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Register user with data.
   *
   * Returns { id, username, email, isAdmin }
   * Throws BadRequestError on duplicates.
   */
  static async register({ username, password, email, isAdmin = false }) {
    const duplicateCheck = await db.query(
      `SELECT username
       FROM users
       WHERE username = $1`,
      [username]
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users (username, password, email, is_admin)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, is_admin AS "isAdmin"`,
      [username, hashedPassword, email, isAdmin]
    );

    return result.rows[0];
  }

  /** Find all users.
   *
   * Returns [{ id, username, email, isAdmin }, ...]
   */
  static async findAll() {
    const result = await db.query(
      `SELECT id, username, email, is_admin AS "isAdmin"
       FROM users
       ORDER BY username`
    );

    return result.rows;
  }

  /** Get user by id.
   *
   * Returns { id, username, email, isAdmin, applications }
   *   where applications is [{ id, company, jobTitle, status }, ...]
   * Throws NotFoundError if user not found.
   */
  static async get(id) {
    const userRes = await db.query(
      `SELECT id, username, email, is_admin AS "isAdmin"
       FROM users
       WHERE id = $1`,
      [id]
    );

    const user = userRes.rows[0];
    if (!user) throw new NotFoundError(`No user: ${id}`);

    const applicationsRes = await db.query(
      `SELECT id, company, job_title AS "jobTitle", status
       FROM applications
       WHERE user_id = $1`,
      [id]
    );

    user.applications = applicationsRes.rows;
    return user;
  }

  /** Delete user by id; returns undefined. */
  static async remove(id) {
    const result = await db.query(
      `DELETE FROM users
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (!result.rows[0]) throw new NotFoundError(`No user: ${id}`);
  }

  /** Apply for a job application: update database.
   *
   * - username: username applying for a job
   * - applicationId: job application ID
   *
   * Returns undefined on success.
   * Throws NotFoundError if application or user does not exist.
   */
  static async applyToJob(username, applicationId) {
    const appCheck = await db.query(
      `SELECT id
       FROM applications
       WHERE id = $1`,
      [applicationId]
    );

    if (!appCheck.rows[0]) {
      throw new NotFoundError(`No application: ${applicationId}`);
    }

    const userCheck = await db.query(
      `SELECT username
       FROM users
       WHERE username = $1`,
      [username]
    );

    if (!userCheck.rows[0]) {
      throw new NotFoundError(`No user: ${username}`);
    }

    await db.query(
      `INSERT INTO user_applications (application_id, username)
       VALUES ($1, $2)`,
      [applicationId, username]
    );
  }
}

module.exports = User;
