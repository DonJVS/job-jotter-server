"use strict";

const express = require("express");
const { ensureLoggedIn, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const jsonschema = require("jsonschema");

const Application = require("../models/Application");
const Reminder = require("../models/Reminder");
const Interview = require("../models/Interview")
const applicationNewSchema = require("../schemas/applicationNew.json");
const applicationUpdateSchema = require("../schemas/applicationUpdate.json");
const validateSchema = require("../middleware/validation");
const { BadRequestError } = require("../expressError");

const router = express.Router();

/** POST / { application } => { application }
 *
 * Creates a new application.
 * Request body must include { userId, company, jobTitle, status, dateApplied, notes }.
 *
 * Returns the newly created application:
 * { application: { id, userId, company, jobTitle, status, dateApplied, notes } }
 *
 * Authorization required: logged-in user
 */
router.post("/", ensureLoggedIn, validateSchema(applicationNewSchema), async function (req, res, next) {
  try {
    const userId = res.locals.user.id; // Get userId from JWT token
    const applicationData = { ...req.body, userId }; // Add userId to the application data

    const application = await Application.add(applicationData);
    return res.status(201).json({ application });
  } catch (err) {
    return next(err);
  }
});


/** GET /:username => { applications: [ { id, company, jobTitle, status, dateApplied, notes }, ... ] }
 *
 * Returns all applications for the specified user.
 * Authorization required: correct user
 */
router.get("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const username = res.locals.user.username;
    const applications = await Application.findByUser(username);
    return res.json({ applications });
  } catch (err) {
    return next(err);
  }
});




/** GET /:id => { application }
 *
 * Returns details for a single application:
 * { application: { id, userId, company, jobTitle, status, dateApplied, notes } }
 *
 * Authorization required: correct user
 */
router.get("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const application = await Application.getWithDetails(req.params.id);
    return res.json({ application });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /:id { application } => { application }
 *
 * Data can include:
 *   { company, jobTitle, status, dateApplied, notes }
 *
 * Returns the updated application:
 * { application: { id, userId, company, jobTitle, status, dateApplied, notes } }
 *
 * Authorization required: correct user
 */
router.patch("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, applicationUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const application = await Application.update(req.params.id, req.body);
    if (!application) throw new NotFoundError(`No application: ${req.params.id}`);
    return res.json({ application });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /:id => { deleted: id }
 *
 * Deletes an application.
 * Authorization required: correct user
 */
router.delete("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    await Application.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

/** GET /applications/:id/interviews => { interviews } 
 *
 * Returns all interviews for a specific application.
 *
 * Authorization required: correct user
 */
router.get("/:id/interviews", ensureLoggedIn, async function (req, res, next) {
  try {
    const interviews = await Interview.findByApplication(req.params.id);
    return res.json({ interviews });
  } catch (err) {
    return next(err);
  }
});

/** GET /:id/reminders => { reminders }
 *
 * Returns all reminders for a specific application.
 *
 * Authorization required: correct user
 */
router.get("/:id/reminders", ensureLoggedIn, async function (req, res, next) {
  try {
    const reminders = await Reminder.findByApplication(req.params.id);
    return res.json({ reminders });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
