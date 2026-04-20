const authService = require("./auth.service");
const { signupSchema, loginSchema } = require("./auth.validation");

// --------------------------------------
// 📝 REGISTER
// --------------------------------------
exports.register = async (req, res) => {
  try {
    const result = signupSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0].message,
      });
    }

    const data = await authService.register(result.data);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data,
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);

    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Something went wrong during registration",
    });
  }
};


// --------------------------------------
// 🔐 LOGIN
// --------------------------------------
exports.login = async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0].message,
      });
    }

    const data = await authService.login(result.data);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data,
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(err.statusCode || 401).json({
      success: false,
      message: err.message || "Invalid email or password",
    });
  }
};



// --------------------------------------
// 🚪 LOGOUT
// --------------------------------------
exports.logout = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await authService.logout(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });

  } catch (err) {
    console.error("LOGOUT ERROR:", err);

    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Logout failed",
    });
  }
};