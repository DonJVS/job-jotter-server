const jsonschema = require("jsonschema");
const { BadRequestError } = require("../expressError");

function validateSchema(schema) {
  return function (req, res, next) {
    const validator = jsonschema.validate(req.body, schema);
    if (!validator.valid) {
      const errors = validator.errors.map(err => err.stack);
      throw new BadRequestError(errors);
    }
    return next();
  };
}

module.exports = validateSchema;
