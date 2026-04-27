// ========================================
// analytics.controller.js
// ========================================

const analyticsService = require("./analytics.service");
const { analyticsValidation } = require("./analytics.validation");

exports.createMetric = async (req, res) => {
  try {
    const { error } = analyticsValidation.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const metric = await analyticsService.createMetric({
      ...req.body,
      companyId: req.user.companyId,
      createdBy: req.user.id,
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

exports.getMetrics = async (req, res) => {
  try {
    const metrics = await analyticsService.getMetrics(req.user.companyId);

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

exports.getDashboardSummary = async (req, res) => {
  try {
    const summary = await analyticsService.getDashboardSummary(
      req.user.companyId
    );

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

exports.getRevenueTrend = async (req, res) => {
  try {
    const trend = await analyticsService.getRevenueTrend(req.user.companyId);

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

exports.deleteMetric = async (req, res) => {
  try {
    await analyticsService.deleteMetric(req.params.id, req.user.companyId);

    res.json({
      success: true,
      message: "Metric deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
