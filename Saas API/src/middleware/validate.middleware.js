module.exports = function (schema, property = "body") {
  return function (req, res, next) {
    try {
      const data = req[property] || {};

      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((e) => e.message),
        });
      }

      req[property] = value;

      return next(); // ✅ IMPORTANT: return
    } catch (err) {
      return next(err); // ✅ IMPORTANT
    }
  };
};