const analyticsService = require("./analytics.service");
const { analyticsValidation } = require("./analytics.validation");

// ===============================
// 🔐 ACCESS FILTER (RBAC)
// ===============================
const buildAccessFilter = (user) => {
  const base = {
    tenantId: user.tenantId,
  };

  // ADMIN → full access
  if (user.role === "admin") return base;

  // MANAGER → team level
  if (user.role === "manager") {
    return {
      ...base,
      $or: [
        { managerId: user.id },
        { createdBy: user.id },
      ],
    };
  }

  // EMPLOYEE → only own
  return {
    ...base,
    createdBy: user.id,
  };
};

// ===============================
// CREATE METRIC
// ===============================
exports.createMetric = async (req, res) => {
  try {
    if (req.user.role === "employee") {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    const { error } = analyticsValidation.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const metric = await analyticsService.createMetric({
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user.id,
      managerId: req.user.role === "manager" ? req.user.id : undefined,
    });

    res.status(201).json({
      success: true,
      data: metric,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// GET METRICS
// ===============================
exports.getMetrics = async (req, res) => {
  try {
    const filter = buildAccessFilter(req.user);

    const metrics = await analyticsService.getMetrics(filter);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// DASHBOARD SUMMARY
// ===============================
exports.getDashboardSummary = async (req, res) => {
  try {
    const filter = buildAccessFilter(req.user);

    const summary = await analyticsService.getDashboardSummary(filter);

    res.json({
      success: true,
      data: summary,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// REVENUE TREND
// ===============================
exports.getRevenueTrend = async (req, res) => {
  try {
    const filter = buildAccessFilter(req.user);

    const trend = await analyticsService.getRevenueTrend(filter);

    res.json({
      success: true,
      data: trend,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// DELETE METRIC (ADMIN ONLY)
// ===============================
exports.deleteMetric = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete",
      });
    }

    await analyticsService.deleteMetric(
      req.params.id,
      req.user.tenantId
    );

    res.json({
      success: true,
      message: "Metric deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};