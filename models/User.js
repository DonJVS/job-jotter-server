"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");
const { NotFoundError, BadRequestError, UnauthorizedError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

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
  static async register({ username, password, email, firstName, lastName, isAdmin = false }) {
    // Check for duplicate username
    const duplicateCheck = await db.query(
      `SELECT username
       FROM users
       WHERE username = $1`,
      [username]
    );
  
    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }
  
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
  
    // Insert new user into the database
    const result = await db.query(
      `INSERT INTO users (username, password, email, first_name, last_name, is_admin)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, first_name AS "firstName", last_name AS "lastName", is_admin AS "isAdmin"`,
      [username, hashedPassword, email, firstName, lastName, isAdmin]
    );
  
    // Return the newly created user
    return result.rows[0];
  }
  

  /** Find all users.
   *
   * Returns [{ id, username, email, isAdmin }, ...]
   */
  static async findAll() {
    const result = await db.query(
    `SELECT id, username, 
            first_name AS "firstName", 
            last_name AS "lastName", 
            email, 
            is_admin AS "isAdmin"
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
  static async get(username) {
    if (!username) {
      throw new TypeError("Username is required");
    }
  
    console.log("Getting user with username:", username); // Debugging
  
    const userRes = await db.query(
      `SELECT id, 
              username, 
              first_name AS "firstName", 
              last_name AS "lastName", 
              email, 
              is_admin AS "isAdmin"
       FROM users
       WHERE username = $1`,
      [username]
    );
  
    const user = userRes.rows[0];
  
    if (!user) {
      throw new NotFoundError(`No user: ${username}`);
    }
  
    console.log("Found user:", user); // Debugging
  
    const applicationsRes = await db.query(
      `SELECT id, 
              company, 
              job_title AS "jobTitle", 
              status
       FROM applications
       WHERE user_id = $1`,
      [user.id]
    );
  
    user.applications = applicationsRes.rows;
  
    console.log("User applications:", user.applications); // Debugging
  
    return user;
  }

    /** Update user details with `data`.
   *
   * This is a "partial update" --- it only changes the fields provided.
   *
   * Data can include:
   *   { firstName, lastName, password, email, isAdmin }
   *
   * Returns { id, username, firstName, lastName, email, isAdmin }
   *
   * Throws NotFoundError if user not found.
   */
  static async update(username, data) {
    // Hash password if provided
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    // Generate SQL for partial update
    const { setCols, values } = sqlForPartialUpdate(data, {
      firstName: "first_name",
      lastName: "last_name",
      email: "email",
      isAdmin: "is_admin",
    });
    const usernameVarIdx = `$${values.length + 1}`;

    const querySql = `
      UPDATE users
      SET ${setCols}
      WHERE username = ${usernameVarIdx}
      RETURNING id,
                username,
                first_name AS "firstName",
                last_name AS "lastName",
                email,
                is_admin AS "isAdmin"`;
    const result = await db.query(querySql, [...values, username]);

    const user = result.rows[0];
    if (!user) throw new NotFoundError(`No user: ${username}`);
    return user;
  }

  /** Delete user by id; returns undefined. */
  static async remove(username) {
    const result = await db.query(
      `DELETE
       FROM users
       WHERE username = $1
       RETURNING username`,
      [username]
    );
  
    const user = result.rows[0];
  
    if (!user) {
      throw new NotFoundError(`No user: ${username}`);
    }
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
      `SELECT id AS user_id
       FROM users
       WHERE username = $1`,
      [username]
    );

    if (!userCheck.rows[0]) {
      throw new NotFoundError(`No user: ${username}`);
    }

    const userId = userCheck.rows[0].user_id;

    await db.query(
      `INSERT INTO user_applications (application_id, user_id)
       VALUES ($1, $2)`,
      [applicationId, userId]
    );
  }
}

module.exports = User;
