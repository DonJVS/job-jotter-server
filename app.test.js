const request = require("supertest");
const app = require("./app");
const db = require("./db");

describe("App tests", function () {
  test("returns 404 for nonexistent route", async function () {
    const resp = await request(app).get("/no-such-path");
    expect(resp.statusCode).toEqual(404);
  });

  test("returns 404 and tests stack trace when NODE_ENV is not 'test'", async function () {
    const originalNodeEnv = process.env.NODE_ENV; // Save the original NODE_ENV
    process.env.NODE_ENV = "";
    const resp = await request(app).get("/no-such-path");
    expect(resp.statusCode).toEqual(404);
    process.env.NODE_ENV = originalNodeEnv; // Restore the original NODE_ENV
  });
});

  // Test for root endpoint
  test("returns welcome message for root route", async function () {
    const resp = await request(app).get("/");
    expect(resp.statusCode).toEqual(200);
    expect(resp.text).toEqual("Welcome to Job Jotter API!");
  });

// Close the database connection after all tests
afterAll(function () {
  db.end();
});
