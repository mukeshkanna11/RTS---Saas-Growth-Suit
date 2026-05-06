module.exports = function tenantMiddleware(req, res, next) {
  try {
    // 🔐 Must come after auth middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - user not found",
      });
    }

    // 🏢 Ensure tenant exists (SAAS CORE RULE)
    if (!req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: "Access denied - tenant not assigned",
      });
    }

    // ✅ Normalize tenant context (GLOBAL SAFE WAY)
    req.tenant = {
      id: req.user.tenantId,
      role: req.user.role,
      userId: req.user.id,
    };

    // 🔥 DO NOT mutate req.query directly (safe SaaS rule)
    // Instead expose a clean filter object
    req.tenantFilter = {
      tenantId: req.user.tenantId,
      isDeleted: false,
    };

    // 👇 optional scoped filter helper (for CRM / leads / users)
    req.buildTenantQuery = (extra = {}) => ({
      tenantId: req.user.tenantId,
      isDeleted: false,
      ...extra,
    });

    next();
  } catch (error) {
    console.error("Tenant Middleware Error:", error);

    return res.status(500).json({
      success: false,
      message: "Tenant middleware failed",
    });
  }
};