const authService = require("./auth.service");
const { signupSchema, loginSchema } = require("./auth.validation");

/* ================= RESPONSE HELPERS ================= */
const success = (res, data, message = "Success", code = 200) =>
  res.status(code).json({ success: true, message, data });

const fail = (res, message = "Error", code = 400) =>
  res.status(code).json({ success: false, message });

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
  try {
    const result = signupSchema.safeParse(req.body);

    if (!result.success) {
      return fail(res, result.error.issues?.[0]?.message || "Validation error", 400);
    }

    const data = await authService.register(result.data);

    return success(res, data, "Account created successfully", 201);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Registration failed",
    });
  }
};

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return fail(res, "Validation error", 400);
    }

    const data = await authService.login(result.data);

    if (!data?.token || !data?.user) {
      return fail(res, "Invalid login response", 500);
    }

    res.cookie("refreshToken", data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return success(res, data, "Login successful");

  } catch (err) {
    return res.status(err.statusCode || 401).json({
      success: false,
      message: err.message || "Login failed",
    });
  }
};

/* ================= LOGOUT ================= */
exports.logout = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (userId) {
      await authService.logout(userId);
    }

    res.clearCookie("refreshToken");

    return success(res, null, "Logged out successfully");

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

/* ================= ⭐ NEW: /ME ROUTE ================= */
exports.me = async (req, res) => {
  try {
    return success(res, req.user, "User profile loaded");
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to load user",
    });
  }
};