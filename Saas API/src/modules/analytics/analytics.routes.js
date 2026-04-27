// ========================================
// analytics.routes.js
// ========================================

const express = require("express");
const router = express.Router();

const controller = require("./analytics.controller");
const auth = require("../../middleware/auth.middleware");

router.post("/", auth, controller.createMetric);
router.get("/", auth, controller.getMetrics);
router.get("/summary", auth, controller.getDashboardSummary);
router.get("/revenue-trend", auth, controller.getRevenueTrend);
router.delete("/:id", auth, controller.deleteMetric);

module.exports = router;