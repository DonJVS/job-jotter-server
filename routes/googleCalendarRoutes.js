const express = require("express");
const { authorize, listEvents } = require("../helpers/googleCalendarHelper");
const { ensureLoggedIn } = require("../middleware/auth");
const { google } = require("googleapis");


const router = express.Router();

// GET /google-calendar/events - Fetch upcoming events
router.get("/events", ensureLoggedIn, async (req, res) => {
  try {
    const currentUserId = res.locals.user.id;
    const auth = await authorize(currentUserId);
    const events = await listEvents(auth);

    if (events.length === 0) {
      return res.json({ message: "No upcoming events found." });
    }

    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Failed to fetch events." });
  }
});

// Example for POST /google-calendar/events - Add an event (optional)
router.post("/events", ensureLoggedIn, async (req, res) => {
  try {
    const { start, end, summary, location, description } = req.body;
    const currentUserId = res.locals.user.id;
    const auth = await authorize(currentUserId);
    const calendar = google.calendar({ version: "v3", auth });

    if ((start.date && end.dateTime) || (start.dateTime && end.date)) {
      return res.status(400).json({
        error: "Start and end times must either both be 'date' or both be 'dateTime'.",
      });
    }

    const event = {
      summary,
      location,
      description,
      start,
      end,
    };

    const result = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    res.json(result.data);
  } catch (err) {
    console.error("Error adding event:", err);
    res.status(500).json({ error: "Failed to add event." });
  }
});

// PATCH /google-calendar/events/:eventId - Partially update an event
router.patch("/events/:eventId", ensureLoggedIn, async (req, res) => {
  const { eventId } = req.params;
  const { summary, description, location, start, end } = req.body;

  if (!eventId) {
    return res.status(400).json({ error: "Event ID is required." });
  }

  try {
    const currentUserId = res.locals.user.id;
    const auth = await authorize(currentUserId); // Authorize user
    const calendar = google.calendar({ version: "v3", auth });

    // Build the update object
    const updateFields = {};
    if (summary) updateFields.summary = summary;
    if (description) updateFields.description = description;
    if (location) updateFields.location = location;
    if (start) updateFields.start = start; // Ensure `start` has correct structure
    if (end) updateFields.end = end; // Ensure `end` has correct structure

    // Send the patch request to Google Calendar API
    const result = await calendar.events.patch({
      calendarId: "primary",
      eventId,
      requestBody: updateFields,
    });

    res.status(200).json({ message: `Event updated successfully.`, event: result.data });
  } catch (err) {
    if (err.code === 404) {
      console.error(`Event with ID ${eventId} not found.`);
      return res.status(404).json({ error: `Event with ID ${eventId} not found.` });
    }
    console.error("Error updating event:", err);
    res.status(500).json({ error: "Failed to update event." });
  }
});


// Delete an event
router.delete("/events/:eventId", ensureLoggedIn, async (req, res) => {
  const { eventId } = req.params;

  if (!eventId) {
    return res.status(400).json({ error: "Event ID is required." });
  }

  try {
    const currentUserId = res.locals.user.id;
    const auth = await authorize(currentUserId);
    const calendar = google.calendar({ version: "v3", auth });

    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });

    res.status(200).json({ message: `Event with ID ${eventId} deleted.` });
  } catch (err) {
    if (err.code === 404) {
      console.error(`Event with ID ${eventId} not found.`);
      return res.status(404).json({ error: `Event with ID ${eventId} not found.` });
    }
    console.error("Error deleting event:", err.response?.data || err);
    res.status(500).json({ error: "Failed to delete event." });
  }
});


module.exports = router;
