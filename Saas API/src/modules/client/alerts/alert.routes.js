const express = require(
  "express"
);

const router =
  express.Router();

const {
  protect,
  authorize,
} = require(
  "../../../middleware/auth.middleware"
);

const alertController = require(
  "./alert.controller"
);

/* ==========================================
   CREATE
========================================== */

router.post(
  "/",
  protect,
  authorize(
    "admin",
    "manager"
  ),
  alertController.createAlert
);

/* ==========================================
   GET ALL
========================================== */

router.get(
  "/",
  protect,
  authorize(
    "admin",
    "manager",
    "client"
  ),
  alertController.getAlerts
);

/* ==========================================
   UNREAD COUNT
========================================== */

router.get(
  "/unread-count",
  protect,
  authorize(
    "admin",
    "manager",
    "client"
  ),
  alertController.getUnreadCount
);

/* ==========================================
   GENERATE ALERTS
========================================== */

router.post(
  "/generate",
  protect,
  authorize(
    "admin",
    "manager"
  ),
  alertController.generateAlerts
);

/* ==========================================
   MARK READ
========================================== */

router.patch(
  "/:id/read",
  protect,
  authorize(
    "admin",
    "manager",
    "client"
  ),
  alertController.markAsRead
);

/* ==========================================
   MARK ALL READ
========================================== */

router.patch(
  "/mark-all-read",
  protect,
  authorize(
    "admin",
    "manager",
    "client"
  ),
  alertController.markAllRead
);

/* ==========================================
   DELETE
========================================== */

router.delete(
  "/:id",
  protect,
  authorize(
    "admin",
    "manager"
  ),
  alertController.deleteAlert
);

module.exports = router;