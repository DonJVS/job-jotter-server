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
    console.debug("authenticateJWT: Authorization header received:", authHeader);

    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      console.debug("authenticateJWT: Extracted token:", token);

      res.locals.user = jwt.verify(token, SECRET_KEY);
      console.debug("authenticateJWT: Verified payload:", res.locals.user);
    } else {
      console.warn("authenticateJWT: Missing Authorization Header.");
    }
    return next();
  } catch (err) {
    console.warn("authenticateJWT: Token verification failed:", err.message);
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
    if(!user) throw new UnauthorizedError("Unauthorized access.");

    // Allow access if the user is admin
    if (user.isAdmin) return next();

    // Check if username matches when a specific user is required
    if (req.params.username && user.username === req.params.username) {
      return next();
    }

    console.warn("ensureCorrectUserOrAdmin: Unauthorized access attempt.");
    throw new UnauthorizedError("Unauthorized access.");
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
