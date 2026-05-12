// =======================================================
// auth.middleware.js
// FIXED PRODUCTION SAAS AUTH MIDDLEWARE
// =======================================================

const jwt = require("jsonwebtoken");
const User = require("../modules/user/user.model");

// =======================================================
// BUILD USER CONTEXT
// =======================================================

const buildUserContext = (user) => ({
  id: user?._id?.toString(),
  name: user?.name || null,
  email: user?.email || null,
  role: user?.role || "employee",
  tenantId: user?.tenantId || null,
  companyId: user?.companyId || null,
  workspaceId: user?.workspaceId || null,
  teamId: user?.teamId || null,
  managerId: user?.managerId || null,
  permissions: user?.permissions || [],
  isSuperAdmin: user?.isSuperAdmin || false,
});

// =======================================================
// EXTRACT TOKEN (FIXED - SINGLE SOURCE)
// =======================================================

const extractToken = (req) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      return req.headers.authorization.split(" ")[1];
    }

    if (req.cookies?.token) {
      return req.cookies.token;
    }

    if (req.headers["x-access-token"]) {
      return req.headers["x-access-token"];
    }

    return null;
  } catch (err) {
    console.error("TOKEN EXTRACT ERROR:", err);
    return null;
  }
};

// =======================================================
// VERIFY TOKEN
// =======================================================

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// =======================================================
// PROTECT MIDDLEWARE (FIXED)
// =======================================================

const protect = async (req, res, next) => {
  try {

    // ✅ FIX 1: ACTUALLY GET TOKEN
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // ✅ VERIFY TOKEN
    let decoded;

    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Token expired or invalid",
      });
    }

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    // ✅ FETCH USER
    const user = await User.findById(decoded.id).select(
      "_id name email role tenantId companyId workspaceId teamId managerId permissions isSuperAdmin isDeleted isActive"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isDeleted || user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "User inactive or deleted",
      });
    }

    // ✅ ATTACH USER
    req.user = buildUserContext(user);

    next();

  } catch (err) {
    console.error("PROTECT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// =======================================================
// AUTHORIZE ROLE
// =======================================================

const authorize = (...roles) => (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (req.user.isSuperAdmin) return next();

    if (
      roles.length > 0 &&
      !roles.includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Authorization failed",
    });
  }
};

// =======================================================
// EXPORT
// =======================================================

module.exports = {
  protect,
  authorize,
};