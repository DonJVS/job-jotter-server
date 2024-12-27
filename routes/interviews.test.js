"use strict";

const request = require("supertest");
const db = require("../db.js");
const app = require("../app");
const {
  commonBeforeAllRoutes,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testInterviewIds,
  testApplicationIds,
  testUserTokens,
} = require("../test/common/routes/_testCommon");

beforeAll(commonBeforeAllRoutes);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /interviews */

describe("POST /interviews", function () {
  test("works for authenticated user", async function () {
    const resp = await request(app)
      .post("/interviews")
      .send({
        applicationId: testApplicationIds[0],
        date: "2024-12-10",
        time: "14:00", // Ensure correct input
        location: "Virtual",
        notes: "Technical interview",
      })
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);
  
    expect(resp.statusCode).toEqual(201);
  
    // Normalize `date` and `time` fields for comparison
    const normalizedResponse = {
      ...resp.body.interview,
      date: resp.body.interview.date.split("T")[0],
      time: resp.body.interview.time.split(":").slice(0, 2).join(":"), // Normalize to HH:MM format
    };
  
    expect(normalizedResponse).toEqual({
      id: expect.any(Number),
      applicationId: testApplicationIds[0],
      date: "2024-12-10",
      time: "14:00",
      location: "Virtual",
      notes: "Technical interview",
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .post("/interviews")
      .send({
        applicationId: testApplicationIds[0],
        date: "2024-12-10",
        time: "14:00:00",
        location: "Virtual",
        notes: "Technical interview",
      });

    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if missing fields", async function () {
    const resp = await request(app)
      .post("/interviews")
      .send({
        applicationId: testApplicationIds[0],
      })
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);

    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /interviews */

describe("GET /interviews", function () {
  test("works for authenticated user", async function () {
    const resp = await request(app)
      .get("/interviews")
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);
  
    expect(resp.statusCode).toEqual(200);
  
    // Normalize received interviews for comparison
    const normalizedInterviews = resp.body.interviews.map((interview) => ({
      ...interview,
      date: interview.date.split("T")[0],
      time: interview.time.split(":").slice(0, 2).join(":"), // Format to HH:MM
    }));
  
    expect(normalizedInterviews).toEqual([
      {
        id: testInterviewIds[0],
        applicationId: testApplicationIds[0],
        company: "TechCorp",
        date: "2024-12-05",
        time: "10:00",
        location: "123 Main St, New York, NY",
        notes: "On-site technical interview.",
      },
      {
        id: testInterviewIds[1],
        applicationId: testApplicationIds[1],
        company: "DataSolutions",
        date: "2024-12-10",
        time: "14:00",
        location: "Virtual",
        notes: "Panel interview via Zoom.",
      },
    ]);
  });
  

  test("unauth for anon", async function () {
    const resp = await request(app).get("/interviews");
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** GET /interviews/:id */

describe("GET /interviews/:id", function () {
  test("works for authenticated user", async function () {
    const resp = await request(app)
      .get(`/interviews/${testInterviewIds[0]}`)
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);

    expect(resp.body).toEqual({
      interview: {
        id: testInterviewIds[0],
        company: "TechCorp",
        date: "2024-12-05T05:00:00.000Z",
        time: "10:00:00",
        location: "123 Main St, New York, NY",
        notes: "On-site technical interview.",
      },
    });
  });

  test("not found for invalid id", async function () {
    const resp = await request(app)
      .get(`/interviews/0`)
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /interviews/:id */

describe("PATCH /interviews/:id", function () {
  test("works for authenticated user", async function () {
    const resp = await request(app)
      .patch(`/interviews/${testInterviewIds[0]}`)
      .send({
        location: "Updated Location",
        notes: "Updated notes",
      })
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);

    expect(resp.body).toEqual({
      interview: {
        id: testInterviewIds[0],
        applicationId: testApplicationIds[0],
        date: "2024-12-05T05:00:00.000Z",
        time: "10:00:00",
        location: "Updated Location",
        notes: "Updated notes",
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/interviews/${testInterviewIds[0]}`)
      .send({
        location: "Updated Location",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for invalid id", async function () {
    const resp = await request(app)
      .patch(`/interviews/0`)
      .send({
        location: "Updated Location",
      })
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** DELETE /interviews/:id */

describe("DELETE /interviews/:id", function () {
  test("works for authenticated user", async function () {
    const resp = await request(app)
      .delete(`/interviews/${testInterviewIds[0]}`)
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);
    expect(resp.body).toEqual({ deleted: `${testInterviewIds[0]}` });
  });

  test("unauth for anon", async function () {
    const resp = await request(app).delete(`/interviews/${testInterviewIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for invalid id", async function () {
    const resp = await request(app)
      .delete(`/interviews/0`)
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);
    expect(resp.statusCode).toEqual(404);
  });
});
