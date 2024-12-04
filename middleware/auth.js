"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");

/** Middleware: Authenticate user.
 *
 * If a token is provided, verify it and store the token payload
 * on `res.locals.user` (includes `username` and `isAdmin` fields).
 *
 * It's not an error if no token is provided or if the token is invalid.
 */
function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
      console.debug("authenticateJWT: Token payload:", res.locals.user); // Debugging
    }
    return next();
  } catch (err) {
    console.warn("authenticateJWT: Invalid or missing token."); // Debugging
    return next();
  }
}

/** Middleware to ensure the user is logged in.
 *
 * If not, raises UnauthorizedError.
 */
function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) {
      console.warn("ensureLoggedIn: No user logged in."); // Debugging
      throw new UnauthorizedError("Must be logged in.");
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to ensure the user is an admin.
 *
 * If not, raises UnauthorizedError.
 */
function ensureAdmin(req, res, next) {
  try {
    if (!res.locals.user || !res.locals.user.isAdmin) {
      console.warn("ensureAdmin: User is not an admin."); // Debugging
      throw new UnauthorizedError("Must be an admin.");
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to ensure the user matches the route parameter or is an admin.
 *
 * If not, raises UnauthorizedError.
 */
function ensureCorrectUserOrAdmin(req, res, next) {
  try {
    const user = res.locals.user;
    console.debug("ensureCorrectUserOrAdmin: Token payload:", user); // Debugging
    console.debug("ensureCorrectUserOrAdmin: Route param username:", req.params.username); // Debugging

    if (!(user && (user.isAdmin || user.username === req.params.username))) {
      console.warn("ensureCorrectUserOrAdmin: Unauthorized access attempt."); // Debugging
      throw new UnauthorizedError("Unauthorized access.");
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureCorrectUserOrAdmin,
};
