// ======================================================
// src/modules/subscription/subscription.routes.js
// FULL UPDATED ROUTES
// ======================================================

const express = require("express");
const router = express.Router();

const controller = require("./subscription.controller");
const { protect } = require("../../middleware/auth.middleware");

// IMPORTANT: specific routes first
router.post("/create", protect, controller.createSubscription);
router.get("/all", protect, controller.getAllSubscriptions);
router.get("/me", protect, controller.getMySubscription);
router.get("/analytics/overview", protect, controller.subscriptionAnalytics);

// dynamic routes after
router.get("/:id", protect, controller.getSubscriptionById);
router.put("/:id", protect, controller.updateSubscription);
router.delete("/:id", protect, controller.deleteSubscription);

router.patch("/:id/change-plan", protect, controller.changePlan);
router.patch("/:id/cancel", protect, controller.cancelSubscription);
router.patch("/:id/reactivate", protect, controller.reactivateSubscription);

module.exports = router;