const { sendValidationError } = require("./apiResponse");

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * On success, replaces req.body with the parsed (defaulted/coerced) value.
 * On failure, returns 400 with structured field errors.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return sendValidationError(res, result.error.issues || []);
  }
  req.body = result.data;
  next();
};

module.exports = { validate };
