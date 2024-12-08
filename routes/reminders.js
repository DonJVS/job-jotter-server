"use strict";

const express = require("express");
const { ensureLoggedIn, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const jsonschema = require("jsonschema");

const Reminder = require("../models/Reminder");
const reminderNewSchema = require("../schemas/reminderNew.json");
const reminderUpdateSchema = require("../schemas/reminderUpdate.json");
const { BadRequestError } = require("../expressError");

const router = express.Router();

/** POST / { reminder } => { reminder }
 *
 * Creates a new reminder.
 * Request body must include { userId, reminderType, date, description }.
 *
 * Returns the newly created reminder:
 * { reminder: { id, userId, reminderType, date, description } }
 *
 * Authorization required: logged-in user or admin
 */
router.post("/", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    // Validate the request body using the schema
    const validator = jsonschema.validate(req.body, reminderNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    // Derive userId from the authenticated user
    const userId = res.locals.user.id;
    const reminderData = { ...req.body, userId }; // Add userId to the request body

    // Add the reminder to the database
    const reminder = await Reminder.add(reminderData);
    return res.status(201).json({ reminder });
  } catch (err) {
    console.error("Error in POST /reminders:", err); // Debugging
    return next(err);
  }
});

/** GET / => { reminders: [ { id, userId, reminderType, date, description }, ... ] }
 *
 * Returns all reminders for the logged-in user.
 * Authorization required: logged-in user
 */
router.get("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const userId = res.locals.user.id; // Access user ID from res.locals
    const reminders = await Reminder.findAll(userId); // Pass the user ID to findAll
    return res.json({ reminders });
  } catch (err) {
    return next(err);
  }
});

/** GET /:id => { reminder }
 *
 * Returns details for a single reminder:
 * { reminder: { id, userId, reminderType, date, description } }
 *
 * Authorization required: admin or same user who created the reminder
 */
router.get("/:id", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const reminder = await Reminder.get(req.params.id);
    return res.json({ reminder });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /:id { reminder } => { reminder }
 *
 * Data can include:
 *   { reminderType, date, description }
 *
 * Returns the updated reminder:
 * { reminder: { id, userId, reminderType, date, description } }
 *
 * Authorization required: admin or same user who created the reminder
 */
router.patch("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, reminderUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const reminder = await Reminder.update(req.params.id, req.body);
    return res.json({ reminder });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /:id => { deleted: id }
 *
 * Deletes a reminder.
 * Authorization required: admin or same user who created the reminder
 */
router.delete("/:id", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    await Reminder.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
