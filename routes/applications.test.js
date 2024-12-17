"use strict";

const request = require("supertest");
const db = require("../db.js");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testApplicationIds,
  testUserTokens,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /applications */

describe("POST /applications", function () {
  test("works for authenticated user", async function () {
    const resp = await request(app)
      .post("/applications")
      .send({
        company: "NewCompany",
        jobTitle: "New Job",
        status: "pending",
        dateApplied: "2024-12-01",
        notes: "Excited about this opportunity.",
      })
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);
    expect(resp.statusCode).toEqual(201);

    // Normalize `dateApplied` to match expected format
    const normalizedResponse = {
      application: {
        ...resp.body.application,
        dateApplied: resp.body.application.dateApplied.split("T")[0],
      },
    };

    // Update the test to match the normalized response structure
    expect(normalizedResponse).toEqual({
      application: {
        id: expect.any(Number),
        userId: 1,
        company: "NewCompany",
        jobTitle: "New Job",
        status: "pending",
        dateApplied: "2024-12-01",
        notes: "Excited about this opportunity.",
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .post("/applications")
      .send({
        userId: 1,
        company: "NewCompany",
        jobTitle: "New Job",
        status: "pending",
        dateApplied: "2024-12-01",
        notes: "Excited about this opportunity.",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing fields", async function () {
    const resp = await request(app)
      .post("/applications")
      .send({
        company: "NewCompany",
      })
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/applications")
      .send({
        userId: "not-a-number",
        company: "NewCompany",
        jobTitle: "New Job",
        status: "pending",
        dateApplied: "invalid-date",
        notes: "Excited about this opportunity.",
      })
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /applications/:id */

describe("GET /applications/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .get(`/applications/${testApplicationIds[0]}`)
      .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.body).toEqual({
      application: {
        id: testApplicationIds[0],
        userId: 1,
        company: "TechCorp",
        jobTitle: "Software Engineer",
        status: "applied",
        dateApplied: expect.any(String),
        notes: "Referred by a friend.",
        interviews: expect.any(Array),
        reminders: expect.any(Array),
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app).get(`/applications/${testApplicationIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if application not found", async function () {
    const resp = await request(app)
      .get(`/applications/0`)
      .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /applications/:id */

describe("PATCH /applications/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .patch(`/applications/${testApplicationIds[0]}`)
      .send({
        status: "interviewed",
      })
      .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.body).toEqual({
      application: {
        id: testApplicationIds[0],
        userId: 1,
        company: "TechCorp",
        jobTitle: "Software Engineer",
        status: "interviewed",
        dateApplied: expect.any(String),
        notes: "Referred by a friend.",
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/applications/${testApplicationIds[0]}`)
      .send({
        status: "interviewed",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if application not found", async function () {
    const resp = await request(app)
      .patch(`/applications/0`)
      .send({
        status: "interviewed",
      })
      .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
      .patch(`/applications/${testApplicationIds[0]}`)
      .send({
        dateApplied: "invalid-date",
      })
      .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /applications/:id */

describe("DELETE /applications/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .delete(`/applications/${testApplicationIds[0]}`)
      .set("authorization", `Bearer ${testUserTokens.admin}`);

    // Ensure response matches the structure and type
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ deleted: `${testApplicationIds[0]}` }); // Convert testApplicationIds[0] to a string
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/applications/${testApplicationIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such application", async function () {
    const resp = await request(app)
      .delete(`/applications/0`)
      .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.statusCode).toEqual(404);
  });
});

