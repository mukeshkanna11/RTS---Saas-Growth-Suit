const jwt = require("jsonwebtoken");

const User = require("../modules/user/user.model");
const Company = require("../modules/company/company.model");

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
    const ctx = buildUserContext(user);

    // Attach companyId so subscription checkout (and any other feature that
    // needs the Company ObjectId) never has to do a separate lookup on the frontend.
    // The Company is identified by the shared tenantId — one extra indexed query
    // per authenticated request is acceptable and much cheaper than leaving
    // the frontend broken for every subscription purchase.
    let companyId = null;
    if (user.tenantId) {
      try {
        // Use $ne:true so documents with isDeleted:false, isDeleted:null,
        // or a missing isDeleted field all match correctly.
        let company = await Company.findOne(
          { tenantId: user.tenantId, isDeleted: { $ne: true } },
          { _id: 1 }
        ).lean();

        if (!company) {
          // Company document is missing — this happens when a user was created
          // directly in the DB without going through the registration flow.
          // Auto-create it now so checkout is never blocked.
          console.warn(
            "[Auth] No company found — userId=%s tenantId=%s — auto-creating",
            user._id, user.tenantId
          );
          try {
            company = await Company.create({
              name:     process.env.COMPANY_NAME || "ReadyTechSolutions Pvt Ltd",
              tenantId: user.tenantId,
              owner:    user._id,
            });
          } catch (createErr) {
            if (createErr.code === 11000) {
              // Concurrent request already created it — just fetch
              company = await Company.findOne(
                { tenantId: user.tenantId },
                { _id: 1 }
              ).lean();
            } else {
              console.error(
                "[Auth] Company auto-create failed — userId=%s tenantId=%s: %s",
                user._id, user.tenantId, createErr.message
              );
            }
          }
        }

        companyId = company?._id?.toString() || null;
      } catch (companyErr) {
        console.warn(
          "[Auth] Company lookup failed — userId=%s tenantId=%s: %s",
          user._id, user.tenantId, companyErr.message
        );
      }
    }

    req.user = { ...ctx, companyId };

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