/**
 * Middleware for JSON Schema validation.
 * 
 * This utility validates request bodies against a provided JSON schema.
 * If the validation fails, it throws a `BadRequestError` with the validation errors.
 */

const jsonschema = require("jsonschema");
const { BadRequestError } = require("../expressError");

/**
 * Creates middleware to validate request bodies against a JSON schema.
 * 
 * @param {Object} schema - The JSON schema to validate against.
 * 
 * @returns {Function} Express middleware function for schema validation.
 * 
 * @throws {BadRequestError} Throws an error if validation fails, including validation error details.
 */
function validateSchema(schema) {
  return function (req, res, next) {
    // Validate request body against the schema
    const validator = jsonschema.validate(req.body, schema);
    if (!validator.valid) {
      const errors = validator.errors.map(err => err.stack);
      throw new BadRequestError(errors);
    }
    return next();
  };
}

module.exports = validateSchema;
