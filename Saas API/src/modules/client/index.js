const express = require("express");

const router = express.Router();

const dashboardRoutes =
  require("./dashboard/dashboard.routes");

const campaignRoutes =
  require("./campaigns/campaign.routes");

const alertRoutes =
  require("./alerts/alert.routes");

const notificationRoutes =
  require("./notifications/notification.routes");

router.use("/dashboard", dashboardRoutes);

router.use("/campaigns", campaignRoutes);

router.use("/alerts", alertRoutes);

router.use(
  "/notifications",
  notificationRoutes
);

router.use(
  "/reports",
  require("./reports/report.routes")      
);

router.use(
 "/support",
 require(
 "./integrations/support.routes"
 )
);

module.exports = router;