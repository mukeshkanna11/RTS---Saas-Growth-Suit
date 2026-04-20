const jwt = require("jsonwebtoken");
const User = require("../modules/user/user.model");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ CLEAN SAAS USER OBJECT
    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,

      // 🔥 SAAS TENANT (IMPORTANT)
      tenantId: decoded.tenantId || user.tenantId,
    };

    if (!req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: "tenantId missing for SaaS access",
      });
    }

    next();
  } catch (err) {
    console.error("Auth error:", err.message);

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
    next();
  };
};

module.exports = { protect, authorize };