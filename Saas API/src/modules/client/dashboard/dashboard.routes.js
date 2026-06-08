const express = require("express");
const router = express.Router();

const dashboardController = require("./dashboard.controller");

const {
  protect,
  authorize,
} = require("../../../middleware/auth.middleware");

router.get(
  "/",
  protect,
  authorize("admin", "manager", "client"),
  dashboardController.getDashboard
);

router.get(
  "/growth",
  protect,
  authorize("admin", "manager", "client"),
  dashboardController.getGrowthAnalytics
);

router.get(
  "/analytics",
  protect,
  authorize(
    "admin",
    "manager",
    "client"
  ),
  dashboardController.getAnalytics
);

module.exports = router;