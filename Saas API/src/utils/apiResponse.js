const send = (res, statusCode, success, message, data = null, errors = null) =>
  res.status(statusCode).json({
    success,
    message,
    data,
    errors,
    timestamp: new Date().toISOString(),
  });

const sendSuccess = (res, data, message = "Success", statusCode = 200) =>
  send(res, statusCode, true, message, data, null);

const sendError = (res, message = "An error occurred", statusCode = 400, errors = null) =>
  send(res, statusCode, false, message, null, errors);

const sendValidationError = (res, issues) =>
  send(res, 400, false, issues[0]?.message || "Validation failed", null,
    issues.map((i) => ({ field: i.path.join(".") || "body", message: i.message }))
  );

module.exports = { sendSuccess, sendError, sendValidationError };
