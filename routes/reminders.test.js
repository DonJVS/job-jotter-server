"use strict";

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const { 
  commonBeforeAll, 
  commonBeforeEach, 
  commonAfterEach, 
  commonAfterAll, 
  testUserTokens, 
  testReminderIds, 
  testApplicationIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /reminders */

describe("POST /reminders", function () {
  test("works for authenticated user", async function () {
    const resp = await request(app)
      .post("/reminders")
      .send({
        applicationId: testApplicationIds[0],
        reminderType: "Follow-up",
        date: "2024-12-15",
        description: "Send follow-up email to HR.",
      })
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);
  
    expect(resp.statusCode).toEqual(201);
  
    // Normalize `date` to remove timezone offset
    const normalizedResponse = {
      ...resp.body.reminder,
      date: resp.body.reminder.date.split("T")[0], // Extract only the date part
    };
  
    expect(normalizedResponse).toEqual({
      id: expect.any(Number),
      userId: expect.any(Number),
      applicationId: testApplicationIds[0],
      reminderType: "Follow-up",
      date: "2024-12-15",
      description: "Send follow-up email to HR.",
    });
  });
  

  test("unauth for anon", async function () {
    const resp = await request(app)
      .post("/reminders")
      .send({
        reminderType: "Follow-up",
        date: "2024-12-15",
        description: "Send follow-up email to HR.",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing fields", async function () {
    const resp = await request(app)
      .post("/reminders")
      .send({})
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /reminders */

describe("GET /reminders", function () {
  test("works for authenticated user", async function () {
    const resp = await request(app)
      .get("/reminders")
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);
  
    expect(resp.statusCode).toEqual(200);
    expect(resp.body.reminders.length).toBeGreaterThan(0);
  
    // Normalize `date` field for comparison
    const normalizedReminders = resp.body.reminders.map((reminder) => ({
      ...reminder,
      date: reminder.date.split("T")[0], // Normalize date to exclude time
    }));
  
    expect(normalizedReminders[0]).toEqual({
      id: testReminderIds[0],
      reminderType: "Follow-up",
      date: "2024-12-07",
      description: "Send a follow-up email to TechCorp.",
      company: "TechCorp",
    });
  });
   

  test("unauth for anon", async function () {
    const resp = await request(app)
      .get("/reminders");
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** PATCH /reminders/:id */

describe("PATCH /reminders/:id", function () {
  test("works for authenticated user", async function () {
    const resp = await request(app)
      .patch(`/reminders/${testReminderIds[0]}`)
      .send({
        description: "Updated description",
      })
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);
  
    expect(resp.statusCode).toEqual(200);
  
    // Normalize the date field to match the expected format
    const normalizedResponse = {
      ...resp.body.reminder,
      date: resp.body.reminder.date.split("T")[0],
    };
  
    expect(normalizedResponse).toEqual({
      id: testReminderIds[0],
      reminderType: "Follow-up",
      date: "2024-12-07",
      description: "Updated description",
      applicationId: 1,
    });
  });
  

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/reminders/${testReminderIds[0]}`)
      .send({
        description: "Updated description",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if reminder does not exist", async function () {
    const resp = await request(app)
      .patch(`/reminders/9999`)
      .send({
        description: "Updated description",
      })
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** DELETE /reminders/:id */

describe("DELETE /reminders/:id", function () {
  test("works for authenticated user", async function () {
    const resp = await request(app)
      .delete(`/reminders/${testReminderIds[0]}`)
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ deleted: `${testReminderIds[0]}` });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/reminders/${testReminderIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if reminder does not exist", async function () {
    const resp = await request(app)
      .delete(`/reminders/9999`)
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);
    expect(resp.statusCode).toEqual(404);
  });
});
