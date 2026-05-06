const express = require("express");
const router = express.Router();

const controller = require("./analytics.controller");
const { protect, authorize } = require("../../middleware/auth.middleware");

// CREATE
router.post(
  "/",
  protect,
  authorize("admin", "manager"),
  controller.createMetric
);

// GET ALL
router.get("/", protect, controller.getMetrics);

// SUMMARY
router.get("/summary", protect, controller.getDashboardSummary);

// TREND
router.get("/revenue-trend", protect, controller.getRevenueTrend);

// DELETE
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  controller.deleteMetric
);

module.exports = router;