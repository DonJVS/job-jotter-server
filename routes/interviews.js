"use strict";

const express = require("express");
const { ensureLoggedIn, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const jsonschema = require("jsonschema");

const Interview = require("../models/Interview");
const interviewNewSchema = require("../schemas/interviewNew.json");
const interviewUpdateSchema = require("../schemas/interviewUpdate.json");
const { BadRequestError } = require("../expressError");

const router = express.Router();

/** POST / { interview } => { interview }
 *
 * Creates a new interview.
 * Request body must include { applicationId, date, time, location, notes }.
 *
 * Returns the newly created interview:
 * { interview: { id, applicationId, date, time, location, notes } }
 *
 * Authorization required: logged-in user or admin
 */
router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, interviewNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const interview = await Interview.add(req.body);
    return res.status(201).json({ interview });
  } catch (err) {
    return next(err);
  }
});

/** GET / => { interviews: [ { id, applicationId, date, time, location, notes }, ... ] }
 *
 * Returns all interviews for a single user.
 * Authorization required: logged in user or admin
 */
router.get("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const userId = res.locals.user.id
    const interviews = await Interview.findAll(userId);
    return res.json({ interviews });
  } catch (err) {
    return next(err);
  }
});

/** GET /:id => { interview }
 *
 * Returns details for a single interview:
 * { interview: { id, applicationId, date, time, location, notes } }
 *
 * Authorization required: admin or same user associated with the application
 */
router.get("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const interview = await Interview.get(req.params.id);
    if (!interview) throw new NotFoundError(`No interview with ID: ${req.params.id}`);
    return res.json({ interview });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /:id { interview } => { interview }
 *
 * Data can include:
 *   { date, time, location, notes }
 *
 * Returns the updated interview:
 * { interview: { id, applicationId, date, time, location, notes } }
 *
 * Authorization required: admin or same user associated with the application
 */
router.patch("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, interviewUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const interview = await Interview.update(req.params.id, req.body);
    return res.json({ interview });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /:id => { deleted: id }
 *
 * Deletes an interview.
 * Authorization required: admin or same user associated with the application
 */
router.delete("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    await Interview.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
