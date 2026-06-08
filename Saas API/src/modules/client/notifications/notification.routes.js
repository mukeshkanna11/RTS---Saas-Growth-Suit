const express =
  require("express");

const router =
  express.Router();

const {
  protect,
  authorize,
} = require(
  "../../../middleware/auth.middleware"
);

const notificationController =
  require(
    "./notification.controller"
  );

router.post(
  "/",
  protect,
  authorize(
    "admin",
    "manager"
  ),
  notificationController.createNotification
);

router.get(
  "/",
  protect,
  authorize(
    "admin",
    "manager",
    "client"
  ),
  notificationController.getNotifications
);

router.get(
  "/unread-count",
  protect,
  authorize(
    "admin",
    "manager",
    "client"
  ),
  notificationController.getUnreadCount
);

router.patch(
  "/:id/read",
  protect,
  authorize(
    "admin",
    "manager",
    "client"
  ),
  notificationController.markAsRead
);

router.patch(
  "/mark-all-read",
  protect,
  authorize(
    "admin",
    "manager",
    "client"
  ),
  notificationController.markAllRead
);

router.delete(
  "/:id",
  protect,
  authorize(
    "admin",
    "manager"
  ),
  notificationController.deleteNotification
);

module.exports = router;