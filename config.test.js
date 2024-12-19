"use strict";

let config;

describe("config can come from env", function () {
  beforeEach(() => {
    // Clear the require cache to reload the config module
    jest.resetModules();
  });

  afterEach(() => {
    // Cleanup environment variables
    delete process.env.JWT_SECRET;
    delete process.env.PORT;
    delete process.env.BCRYPT_WORK_FACTOR;
    delete process.env.DATABASE_URL;
    delete process.env.NODE_ENV;
  });

  test("works with custom env vars", function () {
    // Set environment variables
    process.env.JWT_SECRET = "abc";
    process.env.PORT = "5002";
    process.env.DATABASE_URL = "other";
    process.env.NODE_ENV = "other";

    // Reload the config module to apply new env vars
    jest.resetModules();
    const config = require("./config");

    // Assert environment variable overrides
    expect(config.JWT_SECRET).toEqual("abc");
    expect(config.PORT).toEqual(5002);
    expect(config.getDatabaseUri()).toEqual("other");
    expect(config.BCRYPT_WORK_FACTOR).toEqual(12);
  });

  test("works with defaults", function () {
    // Temporarily mock DATABASE_URL
    process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/job_jotter";

    // Reload the config module to test defaults
    config = require("./config");

    // Assert default values
    expect(config.JWT_SECRET).toEqual("Secret_passwrd");
    expect(config.PORT).toEqual(5002); // Default PORT as per your current config
    expect(config.getDatabaseUri()).toMatch(/job_jotter/); // Default DB name
    expect(config.BCRYPT_WORK_FACTOR).toEqual(12); // Default bcrypt factor

    // Clean up the mock
    delete process.env.DATABASE_URL;
  });

  test("works with NODE_ENV=test", function () {
    process.env.NODE_ENV = "test";

    // Reload the config module
    config = require("./config");

    // Assert database URI for test environment
    expect(config.getDatabaseUri()).toContain("job_jotter_test");
  });
});
