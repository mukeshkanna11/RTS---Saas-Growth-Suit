// =======================================================
// auth.middleware.js
// ENTERPRISE SAAS AUTH MIDDLEWARE (FINAL VERSION)
// =======================================================

const jwt = require("jsonwebtoken");
const User = require("../modules/user/user.model");

/**
 * ======================================================
 * BUILD USER CONTEXT (SAFE + CONSISTENT)
 * ======================================================
 */
const buildUserContext = (user) => ({
  id: user._id.toString(),
  name: user.name || "",
  email: user.email || "",
  role: user.role || "employee",

  tenantId: user.tenantId || null,
  companyId: user.companyId || null,

  workspaceId: user.workspaceId || null,
  teamId: user.teamId || null,
  managerId: user.managerId || null,

  permissions: Array.isArray(user.permissions) ? user.permissions : [],

  isSuperAdmin: Boolean(user.isSuperAdmin),
});

/**
 * ======================================================
 * TOKEN EXTRACTION (ROBUST + SAFE)
 * ======================================================
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  if (req.cookies?.token) {
    return req.cookies.token;
  }

  if (req.headers["x-access-token"]) {
    return req.headers["x-access-token"];
  }

  return null;
};

/**
 * ======================================================
 * VERIFY TOKEN (SAFE WRAPPER)
 * ======================================================
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * ======================================================
 * PROTECT MIDDLEWARE (ENTERPRISE SAFE)
 * ======================================================
 */
const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing",
      });
    }

    let decoded;

    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    const user = await User.findById(decoded.id).select(
      "_id name email role tenantId companyId workspaceId teamId managerId permissions isSuperAdmin isDeleted isActive"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({
        success: false,
        message: "User account deleted",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "User account inactive",
      });
    }

    req.user = buildUserContext(user);

    return next();

  } catch (err) {
    console.error("AUTH MIDDLEWARE ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Authentication system error",
    });
  }
};

/**
 * ======================================================
 * ROLE AUTHORIZATION (ENTERPRISE SAFE)
 * ======================================================
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access",
        });
      }

      // SuperAdmin bypass
      if (req.user.isSuperAdmin) {
        return next();
      }

      if (roles.length > 0 && !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: insufficient permissions",
        });
      }

      return next();
    } catch (err) {
      console.error("AUTHORIZE ERROR:", err);

      return res.status(500).json({
        success: false,
        message: "Authorization error",
      });
    }
  };
};

module.exports = {
  protect,
  authorize,
};