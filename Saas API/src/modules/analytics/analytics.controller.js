// =======================================================
// analytics.controller.js
// FULL ENTERPRISE SAAS CONTROLLER
// =======================================================

const analyticsService = require("./analytics.service");
const { analyticsValidation } = require("./analytics.validation");

// =======================================================
// ACCESS FILTER
// =======================================================

const buildAccessFilter = (user) => {
  const base = {
    tenantId: user.tenantId,
    isDeleted: false,
  };

  // ADMIN → full tenant access
  if (user.role === "admin") {
    return base;
  }

  // MANAGER → own + managed
  if (user.role === "manager") {
    return {
      ...base,
      $or: [
        { managerId: user.id },
        { createdBy: user.id },
      ],
    };
  }

  // EMPLOYEE → own only
  return {
    ...base,
    createdBy: user.id,
  };
};

// =======================================================
// CREATE METRIC
// =======================================================

exports.createMetric = async (req, res) => {
  try {
    if (req.user.role === "employee") {
      return res.status(403).json({
        success: false,
        message:
          "Employees are not allowed to create analytics",
      });
    }

    const { error } = analyticsValidation.validate(
      req.body
    );

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const payload = {
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user.id,
      managerId:
        req.user.role === "manager"
          ? req.user.id
          : req.body.managerId || null,
    };

    const metric =
      await analyticsService.createMetric(payload);

    res.status(201).json({
      success: true,
      message: "Metric created successfully",
      data: metric,
    });
  } catch (err) {
    console.error("CREATE METRIC ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =======================================================
// GET ALL METRICS
// =======================================================

exports.getMetrics = async (req, res) => {
  try {
    const filter = buildAccessFilter(req.user);

    const query = {
      ...filter,
    };

    // FILTERS
    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.source) {
      query.source = req.query.source;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.metricName) {
      query.metricName = {
        $regex: req.query.metricName,
        $options: "i",
      };
    }

    // DATE FILTER
    if (req.query.startDate || req.query.endDate) {
      query.recordedAt = {};

      if (req.query.startDate) {
        query.recordedAt.$gte = new Date(
          req.query.startDate
        );
      }

      if (req.query.endDate) {
        query.recordedAt.$lte = new Date(
          req.query.endDate
        );
      }
    }

    const metrics =
      await analyticsService.getMetrics(
        query,
        req.query
      );

    res.json({
      success: true,
      count: metrics.length,
      data: metrics,
    });
  } catch (err) {
    console.error("GET METRICS ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =======================================================
// GET SINGLE METRIC
// =======================================================

exports.getMetricById = async (req, res) => {
  try {
    const filter = buildAccessFilter(req.user);

    const metric =
      await analyticsService.getMetricById(
        req.params.id,
        filter
      );

    if (!metric) {
      return res.status(404).json({
        success: false,
        message: "Metric not found",
      });
    }

    res.json({
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

// =======================================================
// UPDATE METRIC
// =======================================================

exports.updateMetric = async (req, res) => {
  try {
    const filter = buildAccessFilter(req.user);

    const metric =
      await analyticsService.updateMetric(
        req.params.id,
        req.body,
        filter,
        req.user.id
      );

    if (!metric) {
      return res.status(404).json({
        success: false,
        message: "Metric not found",
      });
    }

    res.json({
      success: true,
      message: "Metric updated successfully",
      data: metric,
    });
  } catch (err) {
    console.error("UPDATE METRIC ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =======================================================
// DASHBOARD SUMMARY
// =======================================================

exports.getDashboardSummary = async (
  req,
  res
) => {
  try {
    const filter = buildAccessFilter(req.user);

    const summary =
      await analyticsService.getDashboardSummary(
        filter
      );

    res.json({
      success: true,
      data: summary,
    });
  } catch (err) {
    console.error(
      "DASHBOARD SUMMARY ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =======================================================
// REVENUE TREND
// =======================================================

exports.getRevenueTrend = async (req, res) => {
  try {
    const filter = buildAccessFilter(req.user);

    const trend =
      await analyticsService.getRevenueTrend(
        filter,
        req.query
      );

    res.json({
      success: true,
      data: trend,
    });
  } catch (err) {
    console.error("REVENUE TREND ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =======================================================
// ARCHIVE METRIC
// =======================================================

exports.archiveMetric = async (req, res) => {
  try {
    if (
      !["admin", "manager"].includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const filter = buildAccessFilter(req.user);

    const metric =
      await analyticsService.archiveMetric(
        req.params.id,
        filter
      );

    res.json({
      success: true,
      message: "Metric archived",
      data: metric,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =======================================================
// SOFT DELETE
// =======================================================

exports.deleteMetric = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Only admin can delete analytics",
      });
    }

    await analyticsService.deleteMetric(
      req.params.id,
      req.user.tenantId
    );

    res.json({
      success: true,
      message: "Metric deleted successfully",
    });
  } catch (err) {
    console.error("DELETE METRIC ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};