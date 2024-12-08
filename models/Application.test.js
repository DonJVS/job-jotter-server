"use strict";

const db = require("../db.js");
const { NotFoundError, BadRequestError } = require("../expressError");
const Application = require("./Application");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testApplicationIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newApplication = {
    userId: 1,
    company: "NewCompany",
    jobTitle: "New Job",
    status: "pending",
    dateApplied: "2024-12-01",
    notes: "Excited about this opportunity.",
  };

  test("works", async function () {
    const application = await Application.add(newApplication);
  
    // Normalize the date to match the expected format (YYYY-MM-DD)
    const normalizedApplication = {
      ...application,
      dateApplied: new Date(application.dateApplied).toISOString().split("T")[0],
    };
  
    // Ensure the test compares the normalized date
    expect(normalizedApplication).toEqual({
      id: expect.any(Number),
      userId: newApplication.userId,
      company: newApplication.company,
      jobTitle: newApplication.jobTitle,
      status: newApplication.status,
      notes: newApplication.notes,
      dateApplied: newApplication.dateApplied,
    });

    const found = await db.query(`SELECT * FROM applications WHERE id = $1`, [
      application.id,
    ]);
    expect(found.rows.length).toEqual(1);
  });

  test("bad request with missing data", async function () {
    try {
      await Application.add({
        userId: 1,
        company: "Missing Data Test",
      });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const application = await Application.get(testApplicationIds[0]);

    // Normalize the dateApplied field
    const normalizedApplication = {
      ...application,
      dateApplied: new Date(application.dateApplied).toISOString().split("T")[0],
    };

    expect(normalizedApplication).toEqual({
      id: testApplicationIds[0],
      userId: 1,
      company: "TechCorp",
      jobTitle: "Software Engineer",
      status: "applied",
      dateApplied: "2024-11-01",
      notes: "Referred by a friend.",
    });
  });

  test("not found if no such application", async function () {
    try {
      await Application.get(0); // Invalid ID
      fail("Expected NotFoundError not thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
    }
  });
});


/************************************** update */

describe("update", function () {
  test("works", async function () {
    const updateData = {
      company: "UpdatedCompany",
      jobTitle: "Updated Job",
      status: "interviewed",
      dateApplied: "2024-12-10",
      notes: "Updated notes.",
    };

    const application = await Application.update(testApplicationIds[0], updateData);

    // Normalize the dateApplied field
    const normalizedApplication = {
      ...application,
      dateApplied: new Date(application.dateApplied).toISOString().split("T")[0],
    };

    expect(normalizedApplication).toEqual({
      id: testApplicationIds[0],
      userId: 1,
      ...updateData,
    });
  });

  test("not found if no such application", async function () {
    try {
      await Application.update(0, { company: "NonExistent" });
      fail("Expected NotFoundError not thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
    }
  });

  test("bad request with no data", async function () {
    try {
      await Application.update(testApplicationIds[0], {});
      fail("Expected BadRequestError not thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });
});


/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Application.remove(testApplicationIds[0]);
    const res = await db.query(`SELECT * FROM applications WHERE id = $1`, [
      testApplicationIds[0],
    ]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such application", async function () {
    try {
      await Application.remove(999999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works", async function () {
    const applications = await Application.findAll();
    expect(applications).toEqual([
      {
        id: testApplicationIds[1],
        userId: 1,
        company: "DataSolutions",
        jobTitle: "Data Analyst",
        status: "pending",
        dateApplied: "2024-11-15",
        notes: "Submitted online application.",
      },
      {
        id: testApplicationIds[0],
        userId: 1,
        company: "TechCorp",
        jobTitle: "Software Engineer",
        status: "applied",
        dateApplied: "2024-11-01",
        notes: "Referred by a friend.",
      },
      {
        id: testApplicationIds[2],
        userId: 2,
        company: "InnovateInc",
        jobTitle: "Frontend Developer",
        status: "interviewed",
        dateApplied: "2024-10-20",
        notes: "Phone interview completed.",
      },
    ]);
  });  
});
