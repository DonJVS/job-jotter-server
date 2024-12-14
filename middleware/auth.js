"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
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
    // Get the Authorization header
    const authHeader = req.headers && req.headers.authorization;
    console.debug("Authorization Header:", authHeader);

    if (authHeader) {
      // Extract the token by removing "Bearer " prefix
      const token = authHeader.replace(/^[Bb]earer\s/, "").replace(/"/g, "").trim();
      console.debug("Extracted Token:", token);

      // Verify the token and set the payload in res.locals.user
      res.locals.user = jwt.verify(token, JWT_SECRET);
      console.debug("Decoded Token Payload:", res.locals.user);
    } else {
      console.warn("authenticateJWT: Missing Authorization Header.");
    }

    return next(); // Proceed to the next middleware or route
  } catch (err) {
    console.warn("authenticateJWT: Invalid token or verification failed.");
    return next(); // Proceed without user authentication (non-blocking)
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
    if(!user) throw new UnauthorizedError("Unauthorized access.");
    console.debug("ensureCorrectUserOrAdmin: Token payload:", user);

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
