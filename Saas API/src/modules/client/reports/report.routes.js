const express = require("express");

const router = express.Router();

const {
  protect,
  authorize,
} = require("../../../middleware/auth.middleware");

const reportController = require("./report.controller");

router.post(
  "/",
  protect,
  authorize(
    "admin",
    "manager",
    "client"
  ),
  reportController.createReport
);

router.get(
  "/",
  protect,
  authorize(
    "admin",
    "manager",
    "client"
  ),
  reportController.getReports
);

router.get(
  "/export",
  protect,
  authorize(
    "admin",
    "manager",
    "client"
  ),
  reportController.exportReport
);

router.get(
  "/:id",
  protect,
  authorize(
    "admin",
    "manager",
    "client"
  ),
  reportController.getReportById
);

router.delete(
  "/:id",
  protect,
  authorize(
    "admin",
    "manager",
    "client"
  ),
  reportController.deleteReport
);

module.exports = router;