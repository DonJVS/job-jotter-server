const { commonBeforeAll, testApplicationIds, testInterviewIds, testReminderIds, commonAfterAll } = require("./_testCommon");
const db = require("../db");

describe("commonBeforeAll", () => {
  beforeAll(async () => {
    await commonBeforeAll();
  });

  test("populates testApplicationIds", async function () {
    expect(testApplicationIds.length).toBeGreaterThan(0); // Ensure array is not empty
    const result = await db.query("SELECT * FROM applications");
    expect(result.rows.length).toEqual(testApplicationIds.length); // Ensure IDs match inserted rows
  });

  test("verify testApplicationIds", () => {
    console.log("testApplicationIds:", testApplicationIds);
    expect(testApplicationIds.length).toBeGreaterThan(0);
  });
  

  test("populates testInterviewIds", async function () {
    expect(testInterviewIds.length).toBeGreaterThan(0); // Ensure array is not empty
    const result = await db.query("SELECT * FROM interviews");
    expect(result.rows.length).toEqual(testInterviewIds.length); // Ensure IDs match inserted rows
  });

  test("populates testReminderIds", async function () {
    expect(testReminderIds.length).toBeGreaterThan(0); // Ensure array is not empty
    const result = await db.query("SELECT * FROM reminders");
    expect(result.rows.length).toEqual(testReminderIds.length); // Ensure IDs match inserted rows
  });

  afterAll(async () => {
    await commonAfterAll();
  });
});
