"use strict";

const validateSchema = require("./validation");
const { BadRequestError } = require("../expressError");
const jsonschema = require("jsonschema");

// Mock schema for testing
const testSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    age: { type: "integer", minimum: 0 },
  },
  required: ["name", "age"],
  additionalProperties: false,
};

describe("validateSchema middleware", function () {
  test("passes for valid input", function () {
    const req = { body: { name: "John Doe", age: 30 } };
    const res = {};
    const next = jest.fn();

    const middleware = validateSchema(testSchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalledWith(expect.any(Error));
  });

  test("throws error for invalid input (missing required field)", function () {
    const req = { body: { age: 30 } }; // Missing "name"
    const res = {};
    const next = jest.fn();

    const middleware = validateSchema(testSchema);

    expect(() => middleware(req, res, next)).toThrow(BadRequestError);
  });

  test("throws error for invalid input (wrong data type)", function () {
    const req = { body: { name: "John Doe", age: "thirty" } }; // "age" should be an integer
    const res = {};
    const next = jest.fn();

    const middleware = validateSchema(testSchema);

    expect(() => middleware(req, res, next)).toThrow(BadRequestError);
  });

  test("throws error for invalid input (additional property)", function () {
    const req = { body: { name: "John Doe", age: 30, extra: "not allowed" } }; // Extra property not in schema
    const res = {};
    const next = jest.fn();

    const middleware = validateSchema(testSchema);

    expect(() => middleware(req, res, next)).toThrow(BadRequestError);
  });
});
