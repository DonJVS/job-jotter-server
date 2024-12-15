"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/User");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testUserTokens,
  testApplicationIds,
} = require("./_testCommon");

beforeAll(async () => {
  await commonBeforeAll();
});
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users */

describe("POST /users", function () {
  test("works for admins: create non-admin", async function () {

    const resp = await request(app)
        .post("/users")
        .send({
          username: "NewUser",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: false,
        })
        .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        id: expect.any(Number),
        username: "NewUser",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: false,
      }, token: expect.any(String),
    });
  });

  test("works for admins: create admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "NewUser",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        id: expect.any(Number),
        username: "NewUser",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: true,
      }, token: expect.any(String),
    });
  });

  test("unauth for users", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "NewUser",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${testUserTokens.janeSmith}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "NewUser",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if missing data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "NewUser",
        })
        .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "NewUser",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "not-an-email",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /users */

describe("GET /users", function () {
  test("works for admins", async function () {
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${testUserTokens.admin}`);
  
    expect(resp.body).toEqual({
      users: [
        {
          id: 2,
          username: "jane_smith",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@example.com",
          isAdmin: false,
        },
        {
          id: 1,
          username: "john_doe",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          isAdmin: true,
        },
      ],
    });
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${testUserTokens.janeSmith}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get("/users");
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE users CASCADE");
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .get(`/users/john_doe`)
      .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.body).toEqual({
      user: {
        id: 1,
        username: "john_doe",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        isAdmin: true,
        applications: [
          {
            id: 1,
            company: "TechCorp",
            jobTitle: "Software Engineer",
            status: "applied",
          },
          {
            id: 2,
            company: "DataSolutions",
            jobTitle: "Data Analyst",
            status: "pending",
          },
        ],
      },
    });
  });

  test("works for same user", async function () {
    const resp = await request(app)
      .get(`/users/john_doe`)
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      user: {
        id: 1,
        username: "john_doe",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        isAdmin: true,
        applications: [
          {
            id: 1,
            company: "TechCorp",
            jobTitle: "Software Engineer",
            status: "applied",
          },
          {
            id: 2,
            company: "DataSolutions",
            jobTitle: "Data Analyst",
            status: "pending",
          },
        ],
      },
    });
  });

  test("unauth for other users", async function () {
    const resp = await request(app)
      .get(`/users/john_doe`)
      .set("authorization", `Bearer ${testUserTokens.janeSmith}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .get(`/users/john_doe`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user not found", async function () {
    const resp = await request(app)
      .get(`/users/nope`)
      .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
  test("works for admins", async function () {
    const resp = await request(app)
      .patch(`/users/john_doe`)
      .send({
        firstName: "New",
      })
      .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.body).toEqual({
      user: {
        id: 1,
        username: "john_doe",
        firstName: "New",
        lastName: "Doe",
        email: "john.doe@example.com",
        isAdmin: true,
      },
    });
  });

  test("works for same user", async function () {
    const resp = await request(app)
      .patch(`/users/john_doe`)
      .send({
        firstName: "New",
      })
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);
    expect(resp.body).toEqual({
      user: {
        id: 1,
        username: "john_doe",
        firstName: "New",
        lastName: "Doe",
        email: "john.doe@example.com",
        isAdmin: true,
      },
    });
  });

  test("unauth if not same user", async function () {
    const resp = await request(app)
      .patch(`/users/john_doe`)
      .send({
        firstName: "New",
      })
      .set("authorization", `Bearer ${testUserTokens.janeSmith}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/users/john_doe`)
      .send({
        firstName: "New",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such user", async function () {
    const resp = await request(app)
      .patch(`/users/nope`)
      .send({
        firstName: "Nope",
      })
      .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
      .patch(`/users/john_doe`)
      .send({
        firstName: 42,
      })
      .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("works: can set new password", async function () {
    const resp = await request(app)
      .patch(`/users/john_doe`)
      .send({
        password: "new-password",
      })
      .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.body).toEqual({
      user: {
        id: 1,
        username: "john_doe",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        isAdmin: true,
      },
    });
    const isSuccessful = await User.authenticate("john_doe", "new-password");
    expect(isSuccessful).toBeTruthy();
  });
});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .delete(`/users/john_doe`)
      .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.body).toEqual({ deleted: "john_doe" });
  });

  test("works for same user", async function () {
    const resp = await request(app)
      .delete(`/users/john_doe`)
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);
    expect(resp.body).toEqual({ deleted: "john_doe" });
  });

  test("unauth if not same user", async function () {
    const resp = await request(app)
      .delete(`/users/john_doe`)
      .set("authorization", `Bearer ${testUserTokens.janeSmith}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/users/john_doe`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user missing", async function () {
    const resp = await request(app)
      .delete(`/users/nope`)
      .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** POST /users/:username/applications/:id */

describe("POST /users/:username/applications/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .post(`/users/john_doe/applications/${testApplicationIds[1]}`)
        .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.body).toEqual({ applied: testApplicationIds[1] });
  });

  test("works for same user", async function () {
    console.log("John Doe Token:", testUserTokens.john_doe);
    console.log("Test Application ID for user:", testApplicationIds[1]);
    const resp = await request(app)
      .post(`/users/john_doe/applications/${testApplicationIds[1]}`)
      .set("authorization", `Bearer ${testUserTokens.john_doe}`);
    console.log("Response Status Code:", resp.statusCode); // Debugging
    console.log("Response Body:", resp.body); // Debugging
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({ applied: testApplicationIds[1] });
  });
  

  test("unauth for others", async function () {
    const resp = await request(app)
        .post(`/users/john_doe/applications/${testApplicationIds[1]}`)
        .set("authorization", `Bearer ${testUserTokens.janeSmith}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post(`/users/john_doe/applications/${testApplicationIds[1]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such username", async function () {
    const resp = await request(app)
        .post(`/users/nope/applications/${testApplicationIds[1]}`)
        .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .post(`/users/john_doe/applications/0`)
        .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request invalid job id", async function () {
    const resp = await request(app)
        .post(`/users/john_doe/applications/0`)
        .set("authorization", `Bearer ${testUserTokens.admin}`);
    expect(resp.statusCode).toEqual(404);
  });
});


