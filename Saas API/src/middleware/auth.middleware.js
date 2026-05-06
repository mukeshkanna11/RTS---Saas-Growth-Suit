const jwt = require("jsonwebtoken");
const User = require("../modules/user/user.model");

/* =========================
   🧠 SAFE USER BUILDER
========================= */
const buildUserContext = (user) => {
  return {
    id: user?._id?.toString() || null,
    name: user?.name || null,
    email: user?.email || null,
    role: user?.role || "employee",
    tenantId: user?.tenantId || null,
  };
};

/* =========================
   🔐 AUTH PROTECT MIDDLEWARE
========================= */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
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

    const user = await User.findById(decoded.id).select(
      "_id name email role tenantId isDeleted isActive"
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

    const safeUser = buildUserContext(user);

    // 🚨 CRITICAL SAFETY CHECK (your real bug fix)
    if (!safeUser.tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant missing in user context",
      });
    }

    req.user = safeUser;

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);

    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

/* =========================
   🧑‍💼 ROLE BASED ACCESS
========================= */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied for this role",
      });
    }

    next();
  };
};

/* =========================
   👑 ADMIN ONLY
========================= */
const adminOnly = authorize("admin");

/* =========================
   🧠 SAAS TENANT FILTER
========================= */
const buildTenantFilter = (user) => {
  if (!user?.tenantId) return { isDeleted: false };

  return {
    tenantId: user.tenantId,
    isDeleted: false,
  };
};

/* =========================
   🧠 ROLE SCOPING FILTER
========================= */
const buildScopeFilter = (user) => {
  if (!user) return { isDeleted: false };

  const base = {
    tenantId: user.tenantId,
    isDeleted: false,
  };

  if (user.role === "admin") return base;

  if (user.role === "manager") {
    return {
      ...base,
      managerId: user.id,
    };
  }

  return {
    ...base,
    assignedTo: user.id,
  };
};

module.exports = {
  protect,
  authorize,
  adminOnly,
  buildTenantFilter,
  buildScopeFilter,
};