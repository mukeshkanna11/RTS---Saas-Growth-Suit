const jwt = require("jsonwebtoken");
const User = require("../modules/user/user.model");

// ==========================================
// AUTH MIDDLEWARE - SaaS Ready Version
// ==========================================

// Protect routes
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token missing.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    // Attach clean user object
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId || user.tenantId || null,
      tenantId: user.tenantId || null,
    };

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    next();
  };
};

// Optional middleware for analytics/admin access
const adminOnly = authorize("admin", "superadmin");

// ==========================================
// EXPORTS
// IMPORTANT: direct function export support
// ==========================================

module.exports = protect;
module.exports.protect = protect;
module.exports.authorize = authorize;
module.exports.adminOnly = adminOnly;