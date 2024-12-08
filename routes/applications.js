"use strict";

const express = require("express");
const { ensureLoggedIn, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const jsonschema = require("jsonschema");

const Application = require("../models/Application");
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
 * Authorization required: logged-in user (or admin if creating for another user)
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


/** GET / => { applications: [ { id, userId, company, jobTitle, status, dateApplied, notes }, ... ] }
 *
 * Returns all applications.
 * Authorization required: admin
 */
router.get("/", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const applications = await Application.findAll();
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
 * Authorization required: admin or same user who created the application
 */
router.get("/:id", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const application = await Application.get(req.params.id);
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
 * Authorization required: admin or same user who created the application
 */
router.patch("/:id", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, applicationUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const application = await Application.update(req.params.id, req.body);
    return res.json({ application });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /:id => { deleted: id }
 *
 * Deletes an application.
 * Authorization required: admin or same user who created the application
 */
router.delete("/:id", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    await Application.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
