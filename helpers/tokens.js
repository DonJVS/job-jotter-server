/**
 * Utility for creating JSON Web Tokens (JWT) for user authentication.
 * 
 * This module provides functionality to create JWTs using user data and a 
 * secret key defined in the environment configuration. These tokens are 
 * essential for securing API routes in the application.
 */

const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

/**
 * Creates a JSON Web Token for a given user.
 * 
 * @param {Object} user - User object containing at least `id` and `username`.
 * @param {string} user.id - Unique identifier for the user.
 * @param {string} user.username - Username of the user.
 * @param {boolean} [user.isAdmin=false] - Indicates if the user has admin privileges.
 * 
 * @throws {Error} Throws an error if the user object is missing required properties.
 * @throws {Error} Throws an error if `JWT_SECRET` is not defined.
 * 
 * @returns {string} A signed JWT containing the user payload.
 */
function createToken(user) {
  // Validate required user properties
  if (!user.username) {
    throw new Error("createToken passed user without required properties");
  }

  // Prepare the payload for the token
  let payload = {
    id: user.id,
    username: user.username,
    isAdmin: user.isAdmin || false, // Default to false if not provided
  };

  if (!JWT_SECRET) {
    throw new Error ("JWT_SECRET is not defined");
  }
  return jwt.sign(payload, JWT_SECRET);
}

module.exports = { createToken };