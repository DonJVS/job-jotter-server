"use strict";

/** Routes for authentication. */

const User = require("../models/User");
const express = require("express");
const rateLimit = require("express-rate-limit");
const router = new express.Router();
const { createToken } = require("../helpers/tokens");
const validateSchema = require("../middleware/validation");
const userAuthSchema = require("../schemas/userAuth.json");
const userRegisterSchema = require("../schemas/userRegister.json");


// Rate limiting setup for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: "Too many login attempts, please try again later." // Fallback message
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      error: options.message || "Too many requests, please try again later.",
    });
  },
});

/** POST /auth/token:  { username, password } => { token }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */
router.post("/token", loginLimiter, validateSchema(userAuthSchema), async function (req, res, next) {
  try {
    const { username, password } = req.body;
    const user = await User.authenticate(username, password);
    
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = createToken(user);
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

/** POST /auth/register:   { user } => { token }
 *
 * user must include { username, password, firstName, lastName, email }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */
router.post("/register", validateSchema(userRegisterSchema), async function (req, res, next) {
  try {
    const newUser = await User.register({ ...req.body, isAdmin: false });

    if (!newUser) {
      return res.status(400).json({ error: "User registration failed" });
    }

    const token = createToken(newUser);
    return res.status(201).json({ token });
  } catch (err) {
    console.error("Error during registration:", err.message);
    return next(err);
  }
});

module.exports = router;
