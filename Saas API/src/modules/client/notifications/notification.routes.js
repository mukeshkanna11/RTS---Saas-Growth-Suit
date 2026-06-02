const express = require("express");

const router = express.Router();

const {
  protect,
  authorize,
} = require("../../../middleware/auth.middleware");

const notificationController =
  require("./notification.controller");

router.post(
  "/",
  protect,
  authorize("admin", "manager"),
  notificationController.createNotification
);

router.get(
  "/",
  protect,
  authorize("admin", "manager", "client"),
  notificationController.getNotifications
);

router.patch(
  "/:id/read",
  protect,
  authorize("admin", "manager", "client"),
  notificationController.markAsRead
);

router.delete(
  "/:id",
  protect,
  authorize("admin", "manager"),
  notificationController.deleteNotification
);

module.exports = router;