const express = require("express");
const { authorize, listEvents } = require("../helpers/googleCalendarHelper");
const { ensureLoggedIn } = require("../middleware/auth");
const { google } = require("googleapis");


const router = express.Router();

// GET /google-calendar/events - Fetch upcoming events
router.get("/events", ensureLoggedIn, async (req, res) => {
  try {
    const auth = await authorize();
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

    const auth = await authorize();
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

    console.log("Event created:", result.data);

    res.json(result.data);
  } catch (err) {
    console.error("Error adding event:", err);
    res.status(500).json({ error: "Failed to add event." });
  }
});

module.exports = router;
