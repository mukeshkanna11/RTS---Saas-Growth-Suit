const jwt = require("jsonwebtoken");

const User = require("../modules/user/user.model");

/* =========================================
   BUILD USER CONTEXT
========================================= */
const buildUserContext = (user) => ({
  id: user._id.toString(),

  name: user.name || "",

  email: user.email || "",

  role: user.role || "employee",

  tenantId: user.tenantId || null,

  managerId: user.managerId || null,

  permissions: Array.isArray(user.permissions)
    ? user.permissions
    : [],

  isSuperAdmin: Boolean(user.isSuperAdmin),
});

/* =========================================
   TOKEN EXTRACTION
========================================= */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  // 🔥 Bearer token
  if (
    authHeader &&
    authHeader.startsWith("Bearer ")
  ) {
    return authHeader.split(" ")[1];
  }

  // 🔥 Cookie token
  if (req.cookies?.token) {
    return req.cookies.token;
  }

  // 🔥 Custom header token
  if (req.headers["x-access-token"]) {
    return req.headers["x-access-token"];
  }

  return null;
};

/* =========================================
   VERIFY TOKEN
========================================= */
const verifyToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_SECRET
  );
};

/* =========================================
   PROTECT MIDDLEWARE
========================================= */
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

    /* =========================================
       GET USER
    ========================================= */
    const user = await User.findById(
      decoded.id
    ).select(
      `
        _id
        name
        email
        role
        tenantId
        managerId
        permissions
        isSuperAdmin
        isDeleted
        isActive
      `
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    /* =========================================
       USER STATUS CHECKS
    ========================================= */
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

    /* =========================================
       BUILD SAFE USER CONTEXT
    ========================================= */
    req.user = buildUserContext(user);

    next();

  } catch (err) {
    console.error(
      "AUTH MIDDLEWARE ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Authentication system error",
    });
  }
};

/* =========================================
   ROLE AUTHORIZATION
========================================= */
const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access",
        });
      }

      /* =========================================
         SUPER ADMIN BYPASS
      ========================================= */
      if (req.user.isSuperAdmin) {
        return next();
      }

      /* =========================================
         ROLE CHECK
      ========================================= */
      if (
        roles.length > 0 &&
        !roles.includes(req.user.role)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden: insufficient permissions",
        });
      }

      next();

    } catch (err) {
      console.error(
        "AUTHORIZE ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Authorization error",
      });
    }
  };
};

/* =========================================
   OPTIONAL PERMISSION MIDDLEWARE
========================================= */
const authorizePermissions = (
  ...permissions
) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // 🔥 Super Admin bypass
      if (req.user.isSuperAdmin) {
        return next();
      }

      const userPermissions =
        req.user.permissions || [];

      const hasPermission =
        permissions.every((permission) =>
          userPermissions.includes(permission)
        );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message:
            "Permission denied",
        });
      }

      next();

    } catch (err) {
      console.error(
        "PERMISSION AUTH ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Permission check failed",
      });
    }
  };
};

module.exports = {
  protect,
  authorize,
  authorizePermissions,
};