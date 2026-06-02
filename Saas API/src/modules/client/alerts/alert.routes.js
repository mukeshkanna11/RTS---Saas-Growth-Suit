const express = require("express");

const router = express.Router();

const {
  protect,
  authorize,
} = require("../../../middleware/auth.middleware");

const alertController = require("./alert.controller");

router.post(
  "/",
  protect,
  authorize("admin", "manager"),
  alertController.createAlert
);

router.get(
  "/",
  protect,
  authorize("admin", "manager", "client"),
  alertController.getAlerts
);

router.patch(
  "/:id/read",
  protect,
  authorize("admin", "manager", "client"),
  alertController.markAsRead
);

router.delete(
  "/:id",
  protect,
  authorize("admin", "manager"),
  alertController.deleteAlert
);

module.exports = router;