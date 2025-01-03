"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");
const express = require("express");
const { authenticateJWT, ensureCorrectUserOrAdmin, ensureAdmin } = require("../middleware/auth");
const bcrypt = require("bcrypt");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const User = require("../models/User");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();
router.use(authenticateJWT);

/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  { user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: admin
 */
router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});

/** GET / => { users: [ { username, firstName, lastName, email, isAdmin }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: admin
 */
router.get("/", ensureAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, email, isAdmin, applications }
 *   where applications is [{ id, company, jobTitle, status }, ...]
 *
 * Authorization required: admin or same-user-as-:username
 */
router.get("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const { username } = req.params;
    const user = await User.get(username);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: admin or same-user-as-:username
 */
router.patch("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const { password, ...updateData } = req.body;

    if (!password) {
      throw new BadRequestError("Password is required to update profile.");
    }

    const user = await User.get(req.params.username);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Incorrect password.");
    }

    const updatedUser = await User.update(req.params.username, updateData);
    return res.json({ user: updatedUser });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: admin or same-user-as-:username
 */
router.delete("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});

/** POST /[username]/jobs/[id]  { state } => { application }
 *
 * Allows a user to apply for a job.
 *
 * Returns {"applied": jobId}
 *
 * Authorization required: admin or same-user-as-:username
 */
router.post("/:username/applications/:id", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const applicationId = +req.params.id;
    await User.applyToJob(req.params.username, applicationId);
    return res.status(201).json({ applied: applicationId });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
