"use strict";

const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");
const Interview = require("./Interview");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testInterviewIds,
  testApplicationIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  let newInterview;

  beforeAll(() => {
    if (!testApplicationIds || testApplicationIds.length === 0) {
      throw new Error("testApplicationIds is not populated. Ensure commonBeforeAll has been run.");
    }

    newInterview = {
      applicationId: testApplicationIds[0],
      date: "2024-12-15",
      time: "14:00:00",
      location: "Virtual",
      notes: "Final technical interview",
    };

    console.log("Prepared newInterview:", newInterview);
  });

  test("works", async function () {
    console.log("testApplicationIds:", testApplicationIds);

    if (!newInterview.applicationId) {
      throw new Error("applicationId is undefined in newInterview");
    }

    const interview = await Interview.add(newInterview);

    // Normalize the returned date to match the format of the expected date
    const normalizedInterview = {
      ...interview,
      date: new Date(interview.date).toISOString().split("T")[0], // Normalize to 'YYYY-MM-DD'
    };

    expect(normalizedInterview).toEqual({
      id: expect.any(Number),
      ...newInterview,
    });

    const result = await db.query(
      `SELECT id, application_id AS "applicationId", date, time, location, notes
       FROM interviews
       WHERE id = $1`,
      [interview.id]
    );

    // Normalize the database date for the comparison
    const dbInterview = {
      ...result.rows[0],
      date: new Date(result.rows[0].date).toISOString().split("T")[0], // Normalize to 'YYYY-MM-DD'
    };

    expect(result.rows.length).toEqual(1);
    expect(dbInterview).toEqual({
      id: interview.id,
      applicationId: newInterview.applicationId,
      date: newInterview.date,
      time: newInterview.time,
      location: newInterview.location,
      notes: newInterview.notes,
    });
  });

  test("bad request with missing data", async function () {
    try {
      await Interview.add({
        date: "2024-12-15",
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
    const interview = await Interview.get(testInterviewIds[0]);

    // Normalize date format for comparison
    const normalizedInterview = {
      ...interview,
      date: new Date(interview.date).toISOString().split("T")[0], // Format date as "YYYY-MM-DD"
    };

    expect(normalizedInterview).toEqual({
      id: testInterviewIds[0],
      applicationId: testApplicationIds[2], // Match the correct application ID
      date: "2024-12-05", // Match the expected date format
      time: "10:00:00",
      location: "123 Main St, New York, NY",
      notes: "On-site technical interview.", // Ensure the note text matches the test data
    });
  });

  test("not found if no such interview", async function () {
    try {
      await Interview.get(99999); // Use an unlikely ID
      fail("Should not succeed.");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});


/************************************** update */

describe("update", function () {
  let updateData;
  
  test("works", async function () {
    const updateData = {
      applicationId: testApplicationIds[0],
      date: "2024-12-20",
      time: "15:00:00",
      location: "Updated Location",
      notes: "Updated notes",
    };
  
    const interview = await Interview.update(testInterviewIds[0], updateData);
  
    // Normalize the date for comparison
    const normalizedInterview = {
      ...interview,
      date: new Date(interview.date).toISOString().split("T")[0],
    };
  
    expect(normalizedInterview).toEqual({
      id: testInterviewIds[0],
      applicationId: testApplicationIds[0],
      ...updateData,
    });
  
    const result = await db.query(
      `SELECT id, application_id AS "applicationId", date, time, location, notes
       FROM interviews
       WHERE id = $1`,
      [testInterviewIds[0]]
    );
  
    const normalizedResult = {
      ...result.rows[0],
      date: new Date(result.rows[0].date).toISOString().split("T")[0],
    };
  
    expect(normalizedResult).toEqual({
      id: testInterviewIds[0],
      applicationId: testApplicationIds[0],
      date: updateData.date,
      time: updateData.time,
      location: updateData.location,
      notes: updateData.notes,
    });
  });
  

  test("not found if no such interview", async function () {
    try {
      await Interview.update(99999, { date: "2024-12-20" }); // Use an unlikely ID
      fail("Should not succeed.");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Interview.update(testInterviewIds[0], {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Interview.remove(testInterviewIds[0]);
    const result = await db.query(
      `SELECT id FROM interviews WHERE id = $1`,
      [testInterviewIds[0]]
    );
    expect(result.rows.length).toEqual(0);
  });

  test("not found if no such interview", async function () {
    try {
      await Interview.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
