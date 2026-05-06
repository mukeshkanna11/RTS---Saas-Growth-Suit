module.exports = function (schema, property = "body") {
  return function (req, res, next) {
    try {
      // -------------------------------
      // 🧠 Schema existence check
      // -------------------------------
      if (!schema) {
        return res.status(500).json({
          success: false,
          message: "Validation schema missing",
        });
      }

      // -------------------------------
      // 🧠 Ensure Joi schema
      // -------------------------------
      if (typeof schema.validate !== "function") {
        return res.status(500).json({
          success: false,
          message:
            "Invalid schema type: expected Joi schema with .validate()",
        });
      }

      const data = req[property] ?? {};

      // -------------------------------
      // 🔍 Validate
      // -------------------------------
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      // -------------------------------
      // ❌ Validation error response
      // -------------------------------
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((e) => e.message),
        });
      }

      // -------------------------------
      // ✅ Attach cleaned data
      // -------------------------------
      req[property] = value;

      next();
    } catch (err) {
      console.error("VALIDATION MIDDLEWARE ERROR:", err);

      return res.status(500).json({
        success: false,
        message: "Internal validation error",
      });
    }
  };
};