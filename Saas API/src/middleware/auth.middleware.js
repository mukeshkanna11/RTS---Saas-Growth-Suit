const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../modules/user/user.model");

// ==========================================
// AUTH MIDDLEWARE - PRODUCTION READY VERSION
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

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload.",
      });
    }

    // Fetch user
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.isDeleted || user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive.",
      });
    }

    // Validate company mapping
    let resolvedCompanyId = null;

    if (
      user.companyId &&
      mongoose.Types.ObjectId.isValid(user.companyId)
    ) {
      resolvedCompanyId = user.companyId;
    }

    // Attach clean user object
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: resolvedCompanyId,
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

// ==========================================
// ROLE-BASED AUTHORIZATION
// ==========================================
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

// ==========================================
// ADMIN ONLY ACCESS
// ==========================================
const adminOnly = authorize("admin", "superadmin");

// ==========================================
// OPTIONAL COMPANY CHECK
// Use this for routes that REQUIRE company mapping
// ==========================================
const requireCompany = (req, res, next) => {
  if (!req.user?.companyId) {
    return res.status(400).json({
      success: false,
      message: "Company not linked.",
    });
  }

  next();
};

// ==========================================
// EXPORTS
// ==========================================
module.exports = protect;
module.exports.protect = protect;
module.exports.authorize = authorize;
module.exports.adminOnly = adminOnly;
module.exports.requireCompany = requireCompany;