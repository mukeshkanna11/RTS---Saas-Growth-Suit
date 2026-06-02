const authService = require("./auth.service");
const {
  signupSchema,
  loginSchema,
} = require("./auth.validation");

/* =========================================
   RESPONSE HELPERS
========================================= */
const success = (
  res,
  data,
  message = "Success",
  code = 200
) => {
  return res.status(code).json({
    success: true,
    message,
    data,
  });
};

const fail = (
  res,
  message = "Error",
  code = 400
) => {
  return res.status(code).json({
    success: false,
    message,
  });
};

/* =========================================
   REGISTER
   Creates Tenant + Admin
========================================= */
exports.register = async (req, res) => {
  try {
    const result = signupSchema.safeParse(req.body);

    if (!result.success) {
      return fail(
        res,
        result.error.issues?.[0]?.message ||
          "Validation error",
        400
      );
    }

    const data = await authService.register(
      result.data
    );

    return success(
      res,
      data,
      "Account created successfully",
      201
    );
  } catch (err) {
    return fail(
      res,
      err.message || "Registration failed",
      err.statusCode || 500
    );
  }
};

/* =========================================
   LOGIN
   Supports:
   - admin
   - manager
   - employee
   - client
========================================= */
exports.login = async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return fail(
        res,
        result.error.issues?.[0]?.message ||
          "Validation error",
        400
      );
    }

    const data = await authService.login(
      result.data
    );

    if (!data?.token || !data?.user) {
      return fail(
        res,
        "Invalid login response",
        500
      );
    }

    /* =========================================
       REFRESH TOKEN COOKIE
    ========================================= */
    res.cookie("refreshToken", data.refreshToken, {
      httpOnly: true,

      secure:
        process.env.NODE_ENV === "production",

      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",

      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return success(
      res,
      {
        token: data.token,
        user: data.user,
      },
      "Login successful"
    );
  } catch (err) {
    return fail(
      res,
      err.message || "Login failed",
      err.statusCode || 401
    );
  }
};

/* =========================================
   LOGOUT
========================================= */
exports.logout = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (userId) {
      await authService.logout(userId);
    }

    res.clearCookie("refreshToken");

    return success(
      res,
      null,
      "Logged out successfully"
    );
  } catch (err) {
    return fail(
      res,
      err.message || "Logout failed",
      500
    );
  }
};

/* =========================================
   CURRENT USER
========================================= */
exports.me = async (req, res) => {
  try {
    return success(
      res,
      req.user,
      "User profile loaded"
    );
  } catch (err) {
    return fail(
      res,
      "Failed to load user",
      500
    );
  }
};