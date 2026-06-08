const express = require("express");

const router = express.Router();

const controller =
  require("./integration.controller");

const {
  protect,
  authorize,
} = require(
  "../../middleware/auth.middleware"
);

router.post(
  "/connect",
  protect,
  authorize(
    "admin",
    "manager"
  ),
  controller.connect
);

router.get(
  "/",
  protect,
  authorize(
    "admin",
    "manager",
    "client"
  ),
  controller.getAll
);

router.get(
  "/:id",
  protect,
  authorize(
    "admin",
    "manager",
    "client"
  ),
  controller.getOne
);

router.patch(
  "/:id/disconnect",
  protect,
  authorize(
    "admin",
    "manager"
  ),
  controller.disconnect
);

router.patch(
  "/:id/settings",
  protect,
  authorize(
    "admin",
    "manager"
  ),
  controller.updateSettings
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  controller.deleteIntegration
);

module.exports = router;