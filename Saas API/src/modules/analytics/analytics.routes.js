// =======================================================
// analytics.routes.js
// ENTERPRISE SAAS ROUTES
// =======================================================

const express = require("express");

const router = express.Router();

const controller = require("./analytics.controller");

const {
  protect,
  authorize,
} = require("../../middleware/auth.middleware");

// =======================================================
// CREATE METRIC
// =======================================================

router.post(
  "/",
  protect,
  authorize("admin", "manager"),
  controller.createMetric
);

// =======================================================
// GET DASHBOARD SUMMARY
// =======================================================

router.get(
  "/summary",
  protect,
  authorize("admin", "manager", "employee"),
  controller.getDashboardSummary
);

// =======================================================
// GET REVENUE TREND
// =======================================================

router.get(
  "/revenue-trend",
  protect,
  authorize("admin", "manager"),
  controller.getRevenueTrend
);

// =======================================================
// GET CATEGORY ANALYTICS
// =======================================================

router.get(
  "/category/:category",
  protect,
  authorize("admin", "manager"),
  controller.getMetrics
);

// =======================================================
// GET SINGLE METRIC
// =======================================================

router.get(
  "/:id",
  protect,
  authorize("admin", "manager", "employee"),
  controller.getMetricById
);

// =======================================================
// GET ALL METRICS
// =======================================================

router.get(
  "/",
  protect,
  authorize("admin", "manager", "employee"),
  controller.getMetrics
);

// =======================================================
// UPDATE METRIC
// =======================================================

router.put(
  "/:id",
  protect,
  authorize("admin", "manager"),
  controller.updateMetric
);

// =======================================================
// ARCHIVE METRIC
// =======================================================

router.patch(
  "/archive/:id",
  protect,
  authorize("admin", "manager"),
  controller.archiveMetric
);

// =======================================================
// DELETE METRIC
// =======================================================

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  controller.deleteMetric
);

module.exports = router;