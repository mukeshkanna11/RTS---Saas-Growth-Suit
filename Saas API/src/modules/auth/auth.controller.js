const authService = require("./auth.service");
const { signupSchema, loginSchema } = require("./auth.validation");

/* ===============================
   🧠 SAFE RESPONSE HELPERS
=============================== */
const success = (res, data, message = "Success", code = 200) =>
  res.status(code).json({ success: true, message, data });

const fail = (res, message = "Error", code = 400) =>
  res.status(code).json({ success: false, message });

/* ===============================
   📝 REGISTER CONTROLLER
=============================== */
exports.register = async (req, res) => {
  try {
    const result = signupSchema.safeParse(req.body);

    if (!result.success) {
      return fail(
        res,
        result.error.issues?.[0]?.message || "Validation error",
        400
      );
    }

    const data = await authService.register(result.data);

    return success(res, data, "Account created successfully", 201);
  } catch (err) {
    console.error("REGISTER ERROR:", err);

    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Registration failed",
    });
  }
};

/* ===============================
   🔐 LOGIN CONTROLLER (FIXED)
=============================== */
/* ===============================
   🔐 LOGIN CONTROLLER
=============================== */
exports.login = async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return fail(
        res,
        result.error.issues?.[0]?.message || "Validation error",
        400
      );
    }

    const data = await authService.login(result.data);

    // =========================================
    // VALIDATION
    // =========================================

    if (!data?.token || !data?.user) {
      return fail(
        res,
        "Login service returned invalid response",
        500
      );
    }

    if (!data.user.tenantId) {
      return fail(
        res,
        "Tenant not assigned to user",
        400
      );
    }

    // =========================================
    // COOKIE SETTINGS
    // =========================================

    const isProduction =
      process.env.NODE_ENV === "production";

   res.cookie("refreshToken", data.refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite:
    process.env.NODE_ENV === "production"
      ? "none"
      : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

    // =========================================
    // RESPONSE
    // =========================================

    return success(
      res,
      {
        token: data.token,
        user: data.user,
      },
      "Login successful"
    );
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(err.statusCode || 401).json({
      success: false,
      message:
        err.message || "Invalid credentials",
    });
  }
};

/* ===============================
   🚪 LOGOUT CONTROLLER
=============================== */
/* ===============================
   🚪 LOGOUT CONTROLLER
=============================== */
exports.logout = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return fail(
        res,
        "Unauthorized access",
        401
      );
    }

    await authService.logout(userId);

    // CLEAR COOKIE
    res.clearCookie("token", {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
    });

    return success(
      res,
      null,
      "Logged out successfully"
    );
  } catch (err) {
    console.error("LOGOUT ERROR:", err);

    return res.status(err.statusCode || 500).json({
      success: false,
      message:
        err.message || "Logout failed",
    });
  }
};