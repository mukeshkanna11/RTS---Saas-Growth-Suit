// =======================================================
// auth.middleware.js
// FULL ENTERPRISE SAAS AUTH MIDDLEWARE
// =======================================================

const jwt = require("jsonwebtoken");

const User = require("../modules/user/user.model");

// =======================================================
// SAFE USER CONTEXT
// =======================================================

const buildUserContext = (user) => {
  return {
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
  };
};

// =======================================================
// VERIFY JWT TOKEN
// =======================================================

const verifyToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_SECRET
  );
};

// =======================================================
// EXTRACT TOKEN
// =======================================================

const extractToken = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith(
      "Bearer "
    )
  ) {
    return req.headers.authorization.split(
      " "
    )[1];
  }

  return null;
};

// =======================================================
// PROTECT MIDDLEWARE
// =======================================================

const protect = async (req, res, next) => {
  try {
    // ==========================================
    // TOKEN
    // ==========================================

    // =======================================================
// EXTRACT TOKEN
// SUPPORTS:
// 1. Bearer Token
// 2. Cookies
// 3. Fallback Headers
// =======================================================

const extractToken = (req) => {
  try {
    // ==========================================
    // BEARER TOKEN
    // ==========================================

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      return req.headers.authorization.split(" ")[1];
    }

    // ==========================================
    // COOKIE TOKEN
    // ==========================================

    if (req.cookies?.token) {
      return req.cookies.token;
    }

    // ==========================================
    // CUSTOM HEADER TOKEN
    // ==========================================

    if (req.headers["x-access-token"]) {
      return req.headers["x-access-token"];
    }

    return null;
  } catch (err) {
    console.error("TOKEN EXTRACT ERROR:", err);

    return null;
  }
};

    // ==========================================
    // VERIFY TOKEN
    // ==========================================

    let decoded;

    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message:
          "Token expired or invalid",
      });
    }

    // ==========================================
    // TOKEN VALIDATION
    // ==========================================

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid token payload",
      });
    }

    // ==========================================
    // FETCH USER
    // ==========================================

    const user = await User.findById(
      decoded.id
    ).select(
      `
        _id
        name
        email
        role
        tenantId
        companyId
        workspaceId
        teamId
        managerId
        permissions
        isSuperAdmin
        isDeleted
        isActive
      `
    );

    // ==========================================
    // USER EXISTS
    // ==========================================

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================================
    // USER ACTIVE CHECK
    // ==========================================

    if (
      user.isDeleted ||
      user.isActive === false
    ) {
      return res.status(403).json({
        success: false,
        message:
          "User inactive or deleted",
      });
    }

    // ==========================================
    // BUILD SAFE CONTEXT
    // ==========================================

    const safeUser =
      buildUserContext(user);

    // ==========================================
    // TENANT VALIDATION
    // ==========================================

    if (
      !safeUser.tenantId &&
      !safeUser.isSuperAdmin
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Tenant missing in user context",
      });
    }

    // ==========================================
    // ATTACH USER
    // ==========================================

    req.user = safeUser;

    next();
  } catch (err) {
    console.error(
      "PROTECT MIDDLEWARE ERROR:",
      err
    );

    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// =======================================================
// ROLE AUTHORIZATION
// =======================================================

const authorize =
  (...roles) =>
  (req, res, next) => {
    try {
      // ========================================
      // USER EXISTS
      // ========================================

      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // ========================================
      // SUPER ADMIN BYPASS
      // ========================================

      if (req.user.isSuperAdmin) {
        return next();
      }

      // ========================================
      // ROLE CHECK
      // ========================================

      if (
        roles.length > 0 &&
        !roles.includes(req.user.role)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied for this role",
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
        message:
          "Authorization failed",
      });
    }
  };

// =======================================================
// PERMISSION AUTHORIZATION
// =======================================================

const authorizePermissions =
  (...permissions) =>
  (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (req.user.isSuperAdmin) {
        return next();
      }

      const userPermissions =
        req.user.permissions || [];

      const hasPermission =
        permissions.some((permission) =>
          userPermissions.includes(
            permission
          )
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
        "PERMISSION ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Permission authorization failed",
      });
    }
  };

// =======================================================
// ADMIN ONLY
// =======================================================

const adminOnly = authorize("admin");

// =======================================================
// MANAGER OR ADMIN
// =======================================================

const managerOrAdmin = authorize(
  "admin",
  "manager"
);

// =======================================================
// TENANT FILTER
// =======================================================

const buildTenantFilter = (
  user = {}
) => {
  // SUPER ADMIN
  if (user.isSuperAdmin) {
    return {
      isDeleted: false,
    };
  }

  // NORMAL TENANT
  return {
    tenantId: user.tenantId,
    isDeleted: false,
  };
};

// =======================================================
// ROLE BASED SCOPE FILTER
// =======================================================

const buildScopeFilter = (
  user = {}
) => {
  // ==========================================
  // BASE FILTER
  // ==========================================

  const base = buildTenantFilter(
    user
  );

  // ==========================================
  // SUPER ADMIN
  // ==========================================

  if (user.isSuperAdmin) {
    return base;
  }

  // ==========================================
  // ADMIN
  // ==========================================

  if (user.role === "admin") {
    return base;
  }

  // ==========================================
  // MANAGER
  // ==========================================

  if (user.role === "manager") {
    return {
      ...base,

      $or: [
        { managerId: user.id },

        { createdBy: user.id },

        { assignedTo: user.id },

        { teamId: user.teamId },
      ],
    };
  }

  // ==========================================
  // EMPLOYEE
  // ==========================================

  return {
    ...base,

    $or: [
      { createdBy: user.id },

      { assignedTo: user.id },
    ],
  };
};

// =======================================================
// OWNER CHECK
// =======================================================

const isOwnerOrAdmin = (
  resourceUserId,
  currentUser
) => {
  if (
    currentUser.isSuperAdmin ||
    currentUser.role === "admin"
  ) {
    return true;
  }

  return (
    resourceUserId?.toString() ===
    currentUser.id?.toString()
  );
};

// =======================================================
// EXPORTS
// =======================================================

module.exports = {
  protect,

  authorize,

  authorizePermissions,

  adminOnly,

  managerOrAdmin,

  buildTenantFilter,

  buildScopeFilter,

  isOwnerOrAdmin,
};