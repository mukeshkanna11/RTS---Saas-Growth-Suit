const express = require("express");

const router = express.Router();

const {
  createAutomation,
  getAutomations,
  getAutomationById,
  updateAutomation,
  deleteAutomation,
  toggleAutomation,
  testAutomation,
} = require("./automation.controller");

const {
  protect,
  authorize,
} = require("../../middleware/auth.middleware");

/* =========================================
   CRUD
========================================= */

router.post(
  "/",
  protect,
  authorize("admin", "manager"),
  createAutomation
);

router.get(
  "/",
  protect,
  authorize(
    "admin",
    "manager",
    "client"
  ),
  getAutomations
);

router.get(
  "/:id",
  protect,
  authorize(
    "admin",
    "manager",
    "client"
  ),
  getAutomationById
);

router.put(
  "/:id",
  protect,
  authorize("admin", "manager"),
  updateAutomation
);

router.delete(
  "/:id",
  protect,
  authorize("admin", "manager"),
  deleteAutomation
);

/* =========================================
   SaaS Actions
========================================= */

router.patch(
  "/:id/toggle",
  protect,
  authorize("admin", "manager"),
  toggleAutomation
);

router.post(
  "/test",
  protect,
  authorize("admin", "manager"),
  testAutomation
);

module.exports = router;