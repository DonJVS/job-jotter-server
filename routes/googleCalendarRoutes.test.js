const request = require("supertest");
const express = require("express");
const googleCalendarRoutes = require("../routes/googleCalendarRoutes");
const { authorize, listEvents } = require("../helpers/googleCalendarHelper");
const { google } = require("googleapis");

jest.mock("../helpers/googleCalendarHelper", () => ({
  authorize: jest.fn(),
  listEvents: jest.fn(), // Mock listEvents
}));

jest.mock("googleapis", () => ({
  google: {
    calendar: jest.fn(),
  },
}));

jest.mock("../middleware/auth", () => ({
  ensureLoggedIn: (req, res, next) => next(),
}));

const app = express();
app.use(express.json());
app.use("/google-calendar", googleCalendarRoutes);

describe("Google Calendar Routes", () => {
  let mockAuth, mockCalendar;

  beforeEach(() => {
    mockAuth = { credentials: "fake-auth-token" };
    authorize.mockResolvedValue(mockAuth);

    mockCalendar = {
      events: {
        list: jest.fn(),
        insert: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
      },
    };
    google.calendar.mockReturnValue(mockCalendar);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /google-calendar/events", () => {
    it("should return events when available", async () => {
      const fakeEvents = [{ id: "1", summary: "Test Event" }];
      listEvents.mockResolvedValue(fakeEvents);

      const res = await request(app).get("/google-calendar/events");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(fakeEvents);
    });

    it("should return a message when no events are found", async () => {
      listEvents.mockResolvedValue([]);

      const res = await request(app).get("/google-calendar/events");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: "No upcoming events found." });
    });

    it("should return 500 on error", async () => {
      listEvents.mockRejectedValue(new Error("Failed"));

      const res = await request(app).get("/google-calendar/events");

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: "Failed to fetch events." });
    });
  });

  describe("POST /google-calendar/events", () => {
    it("should create an event and return it", async () => {
      const eventData = {
        start: { dateTime: "2024-06-20T10:00:00Z" },
        end: { dateTime: "2024-06-20T11:00:00Z" },
        summary: "New Event",
        location: "Test Location",
        description: "Test Description",
      };

      mockCalendar.events.insert.mockResolvedValue({ data: eventData });

      const res = await request(app).post("/google-calendar/events").send(eventData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(eventData);
    });

    it("should return 400 for invalid start and end times", async () => {
      const invalidEvent = {
        start: { date: "2024-06-20" },
        end: { dateTime: "2024-06-20T11:00:00Z" },
      };

      const res = await request(app).post("/google-calendar/events").send(invalidEvent);

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        error: "Start and end times must either both be 'date' or both be 'dateTime'.",
      });
    });

    it("should return 500 on event creation failure", async () => {
      mockCalendar.events.insert.mockRejectedValue(new Error("Failed"));

      const eventData = {
        start: { dateTime: "2024-06-20T10:00:00Z" },
        end: { dateTime: "2024-06-20T11:00:00Z" },
      };

      const res = await request(app).post("/google-calendar/events").send(eventData);

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: "Failed to add event." });
    });
  });

  describe("PATCH /google-calendar/events/:eventId", () => {
    it("should update an event successfully", async () => {
      const updatedEvent = { summary: "Updated Event" };
      mockCalendar.events.patch.mockResolvedValue({ data: updatedEvent });

      const res = await request(app)
        .patch("/google-calendar/events/event123")
        .send(updatedEvent);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        message: "Event updated successfully.",
        event: updatedEvent,
      });
    });

    it("should return 404 for non-existing event", async () => {
      mockCalendar.events.patch.mockRejectedValue({ code: 404 });

      const res = await request(app)
        .patch("/google-calendar/events/event123")
        .send({ summary: "Updated Event" });

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ error: "Event with ID event123 not found." });
    });
  });

  describe("DELETE /google-calendar/events/:eventId", () => {
    it("should delete an event successfully", async () => {
      mockCalendar.events.delete.mockResolvedValue();

      const res = await request(app).delete("/google-calendar/events/event123");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: "Event with ID event123 deleted." });
    });

    it("should return 404 for non-existing event", async () => {
      mockCalendar.events.delete.mockRejectedValue({ code: 404 });

      const res = await request(app).delete("/google-calendar/events/event123");

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ error: "Event with ID event123 not found." });
    });

    it("should return 500 on error", async () => {
      mockCalendar.events.delete.mockRejectedValue(new Error("Failed"));

      const res = await request(app).delete("/google-calendar/events/event123");

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: "Failed to delete event." });
    });
  });
});
