const router = require("express").Router();
const ctrl = require("./subscription.controller");
const { protect } = require("../../middleware/auth.middleware");

// 🔥 NEW SAAS FLOW
router.post("/intent", protect, ctrl.createIntent);
router.post("/confirm-payment", protect, ctrl.confirmPayment);

// 🔥 BASIC
router.get("/me", protect, ctrl.getMySubscription);
router.get("/all", protect, ctrl.getAll);

// 🔥 LIFECYCLE
router.patch("/:id/change-plan", protect, ctrl.changePlan);
router.patch("/:id/cancel", protect, ctrl.cancel);

// 🔥 ANALYTICS
router.get("/analytics/overview", protect, ctrl.analytics);
router.post("/upgrade-request", ctrl.upgradeRequest);

module.exports = router;