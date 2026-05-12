const router = require("express").Router();
const ctrl = require("./subscription.controller");
const { protect, authorize } = require("../../middleware/auth.middleware");

/**
 * ======================================================
 * SUBSCRIPTION ROUTES - ENTERPRISE SAAS (SAFE VERSION)
 * NO undefined crashes + multi-tenant ready
 * ======================================================
 */

// ======================================================
// 🔥 SAFE HELPER (prevents server crash)
// ======================================================
const safe = (fnName) => {
  return (req, res, next) => {
    const fn = ctrl?.[fnName];

    if (!fn) {
      return res.status(501).json({
        success: false,
        message: `Controller missing: ${fnName}`,
      });
    }

    return fn(req, res, next);
  };
};

// ======================================================
// 🔥 PUBLIC ROUTES
// ======================================================
// ======================================================
// WEBHOOK (BEFORE AUTH)
// ======================================================

router.post(
  "/webhook/payment",
  safe("paymentWebhook")
);

// ======================================================
// PUBLIC ROUTES
// ======================================================

router.post(
  "/upgrade-request",
  safe("upgradeRequest")
);

// ======================================================
// AUTH REQUIRED
// ======================================================

router.use(protect);

// ======================================================
// SUBSCRIPTION FLOW
// ======================================================

router.post(
  "/intent",
  safe("createIntent")
);

router.post(
  "/confirm-payment",
  safe("confirmPayment")
);

router.get(
  "/me",
  safe("getMySubscription")
);

// ======================================================
// USER FEATURES
// ======================================================

router.patch(
  "/:id/change-plan",
  safe("changePlan")
);

router.patch(
  "/:id/cancel",
  safe("cancel")
);

router.patch(
  "/:id/reactivate",
  safe("reactivateSubscription")
);

// invoice download
router.get(
  "/:id/invoice",
  safe("downloadInvoice")
);

// audit logs
router.get(
  "/:id/audit",
  safe("getAuditLogs")
);

// ======================================================
// ADMIN ONLY
// ======================================================

router.use(
  authorize(
    "admin",
    "superadmin"
  )
);

router.get(
  "/all",
  safe("getAll")
);

router.get(
  "/analytics/overview",
  safe("analytics")
);

// regenerate invoice
router.post(
  "/:id/invoice/regenerate",
  safe("regenerateInvoice")
);

module.exports = router;