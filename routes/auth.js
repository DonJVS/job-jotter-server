"use strict";

/** Routes for authentication. */

const User = require("../models/User");
const express = require("express");
const router = new express.Router();
const { createToken } = require("../helpers/tokens");
const validateSchema = require("../middleware/validation");
const userAuthSchema = require("../schemas/userAuth.json");
const userRegisterSchema = require("../schemas/userRegister.json");

/** POST /auth/token:  { username, password } => { token }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */
router.post("/token", validateSchema(userAuthSchema), async function (req, res, next) {
  try {
    console.log("Reached POST /auth/token with body:", req.body);
    const { username, password } = req.body;
    const user = await User.authenticate(username, password);
    console.log("User from authenticate:", user);
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = createToken(user);
    console.log("Token about to send:", token);
    return res.json({ token });
  } catch (err) {
    console.error("Error during login:", err.message);
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
