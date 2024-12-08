"use strict";

const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError.js");
const db = require("../db.js");
const User = require("./User.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testApplicationIds,
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** authenticate */

describe("authenticate", function () {
  test("works", async function () {
    const user = await User.authenticate("john_doe", "password1");
    expect(user).toEqual({
      id: expect.any(Number),
      username: "john_doe",
      email: "john.doe@example.com",
      isAdmin: true,
    });
  });

  test("unauth if no such user", async function () {
    try {
      await User.authenticate("nope", "password");
      fail();
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });

  test("unauth if wrong password", async function () {
    try {
      await User.authenticate("john_doe", "wrong");
      fail();
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });
});

/************************************** register */

describe("register", function () {
  const newUser = {
    username: "new_user",
    firstName: "Test",
    lastName: "Tester",
    email: "test@test.com",
    isAdmin: false,
  };

  test("works", async function () {
    let user = await User.register({
      ...newUser,
      password: "password",
    });
    expect(user).toEqual({
      id: expect.any(Number),
      ...newUser,
    });

    const found = await db.query("SELECT * FROM users WHERE username = 'new_user'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].is_admin).toEqual(false);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  test("bad request with duplicate data", async function () {
    try {
      await User.register({
        ...newUser,
        password: "password",
      });
      await User.register({
        ...newUser,
        password: "password",
      });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works", async function () {
    const users = await User.findAll();
    expect(users).toEqual([
      {
        id: expect.any(Number),
        username: "jane_smith",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        isAdmin: false,
      },
      {
        id: expect.any(Number),
        username: "john_doe",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        isAdmin: true,
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let user = await User.get("john_doe");
    expect(user).toEqual({
      id: expect.any(Number),
      username: "john_doe",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      isAdmin: true,
      applications: [
        {
          id: expect.any(Number),
          company: "TechCorp",
          jobTitle: "Software Engineer",
          status: "applied",
        },
        {
          id: expect.any(Number),
          company: "DataSolutions",
          jobTitle: "Data Analyst",
          status: "pending",
        },
      ],
    });
  });

  test("not found if no such user", async function () {
    try {
      await User.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    firstName: "Updated",
    lastName: "User",
    email: "updated@email.com",
    isAdmin: true,
  };

  test("works", async function () {
    const updateData = {
      firstName: "Updated",
      lastName: "User",
      email: "updated@email.com",
      isAdmin: true,
    };
  
    let user = await User.update("john_doe", updateData);
    expect(user).toEqual({
      id: expect.any(Number), // Include the id field
      username: "john_doe",
      ...updateData,
    });
  });
  

  test("not found if no such user", async function () {
    try {
      await User.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request if no data", async function () {
    try {
      await User.update("john_doe", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await User.remove("john_doe");
    const res = await db.query("SELECT * FROM users WHERE username='john_doe'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such user", async function () {
    try {
      await User.remove("nonexistent_user");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
