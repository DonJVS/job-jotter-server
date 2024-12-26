/**
 * Utility for creating JSON Web Tokens (JWT) for user authentication.
 * 
 * This module provides functionality to create JWTs using user data and a 
 * secret key defined in the environment configuration. These tokens are 
 * essential for securing API routes in the application.
 */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/**
 * Creates a JSON Web Token for a given user.
 * 
 * @param {Object} user - User object containing at least `id` and `username`.
 * @param {string} user.id - Unique identifier for the user.
 * @param {string} user.username - Username of the user.
 * @param {boolean} [user.isAdmin=false] - Indicates if the user has admin privileges.
 * 
 * @throws {Error} Throws an error if the user object is missing required properties.
 * @throws {Error} Throws an error if `SECRET_KEY` is not defined.
 * 
 * @returns {string} A signed JWT containing the user payload.
 */
function createToken(user) {
  // Validate required user properties
  if (!user.username) {
    console.error("createToken: Missing username in user object", user);
    throw new Error("createToken passed user without required properties");
  }

  // Prepare the payload for the token
  let payload = {
    id: user.id,
    username: user.username,
    isAdmin: user.isAdmin || false, // Default to false if not provided
  };

  if (!SECRET_KEY) {
    console.error("createToken: SECRET_KEY is not defined")
    throw new Error ("SECRET_KEY is not defined");
  }
  return jwt.sign(payload, SECRET_KEY);
}

module.exports = { createToken };