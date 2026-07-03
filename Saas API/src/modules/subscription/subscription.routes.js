"use strict";

// ======================================================
// subscription.routes.js
// Enterprise SaaS Subscription + PayPal Routes
//
// Safety design:
//   - safe()       wraps subscription.controller exports
//   - safePaypal() wraps paypal.controller exports
//   - Neither wrapper ever crashes the server if an export
//     is missing — returns 501 with a diagnostic body
//   - Startup validation logs all missing exports at boot
//   - GET /debug/routes lists every route and its status
// ======================================================

const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const Joi = require("joi");

const { protect, authorize } = require("../../middleware/auth.middleware");

// ── PayPal service — lazy-loaded for diagnostics endpoint ─────────────────────
let paypalService = null;
try {
  paypalService = require("../../services/paypal.service");
} catch (err) {
  console.error("[Subscription] paypal.service failed to load:", err.message);
}

// ── Controllers — wrapped in try/catch so a load failure
//   never takes down the entire subscription module ─────
let ctrl = {};
let paypalCtrl = {};

try {
  ctrl = require("./subscription.controller");
} catch (err) {
  console.error("[Subscription] CRITICAL: subscription.controller failed to load:", err.message);
}

try {
  paypalCtrl = require("./paypal.controller");
} catch (err) {
  console.error("[Subscription] CRITICAL: paypal.controller failed to load:", err.message);
}

// ── Startup validation ─────────────────────────────────
const CTRL_EXPORTS = [
  "createIntent", "confirmPayment", "getMySubscription", "getAll",
  "changePlan", "cancel", "reactivateSubscription", "generateInvoice",
  "downloadInvoice", "getAuditLogs", "upgradeRequest", "regenerateInvoice",
  "analytics", "paymentWebhook",
];

const PAYPAL_EXPORTS = [
  "createOrder", "captureOrder", "handleWebhook", "cancelPaypalSubscription",
];

const _startupIssues = [];

CTRL_EXPORTS.forEach((fn) => {
  if (typeof ctrl[fn] !== "function") {
    console.warn(`[Subscription] MISSING export: subscription.controller.${fn}`);
    _startupIssues.push({ controller: "subscription.controller", export: fn });
  }
});

PAYPAL_EXPORTS.forEach((fn) => {
  if (typeof paypalCtrl[fn] !== "function") {
    console.warn(`[Subscription] MISSING export: paypal.controller.${fn}`);
    _startupIssues.push({ controller: "paypal.controller", export: fn });
  }
});

if (_startupIssues.length === 0) {
  console.log("[Subscription] All controller exports validated — routes ready ✓");
} else {
  console.error(`[Subscription] ${_startupIssues.length} missing export(s) — affected routes return 501`);
}

// ── Safe wrappers ──────────────────────────────────────
const safe = (fnName) => (req, res, next) => {
  const fn = ctrl[fnName];
  if (typeof fn !== "function") {
    return res.status(501).json({
      success: false,
      errorCode: "ROUTE_NOT_REGISTERED",
      route: req.originalUrl,
      possibleCause: `subscription.controller.${fnName} export missing or undefined`,
    });
  }
  return fn(req, res, next);
};

const safePaypal = (fnName) => (req, res, next) => {
  const fn = paypalCtrl[fnName];
  if (typeof fn !== "function") {
    return res.status(501).json({
      success: false,
      errorCode: "ROUTE_NOT_REGISTERED",
      route: req.originalUrl,
      possibleCause: `paypal.controller.${fnName} export missing or undefined`,
    });
  }
  return fn(req, res, next);
};

// ── Input validation ───────────────────────────────────
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    return res.status(400).json({
      success: false,
      errorCode: "VALIDATION_FAILED",
      message: "Request validation failed",
      errors: error.details.map((d) => ({
        field: d.path.join(".") || "body",
        message: d.message.replace(/['"]/g, ""),
      })),
    });
  }
  req.body = value; // use stripped/coerced value
  next();
};

const schemas = {
  intent: Joi.object({
    // companyId is optional here — if absent the controller resolves it from
    // req.user.companyId (populated by auth middleware on every request).
    // It is still validated when present so garbage values are rejected early.
    companyId:    Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().messages({
      "string.pattern.base": "companyId must be a valid MongoDB ObjectId (24-character hex string)",
    }),
    clientName:   Joi.string().min(2).max(100).required(),
    clientEmail:  Joi.string().email().required(),
    plan:         Joi.string().valid("starter", "growth", "enterprise").required(),
    billingCycle: Joi.string().valid("monthly", "yearly").default("monthly"),
  }),

  createOrder: Joi.object({
    subscriptionId: Joi.string().required(),
  }),

  captureOrder: Joi.object({
    orderId: Joi.string().required(),
  }),

  changePlan: Joi.object({
    plan:         Joi.string().valid("starter", "growth", "enterprise").required(),
    billingCycle: Joi.string().valid("monthly", "yearly").default("monthly"),
  }),

  upgradeRequest: Joi.object({
    name:         Joi.string().min(2).max(100).required(),
    email:        Joi.string().email().required(),
    phone:        Joi.string().max(20).allow("", null).optional(),
    company:      Joi.string().max(100).allow("", null).optional(),
    address:      Joi.string().max(200).allow("", null).optional(),
    notes:        Joi.string().max(500).allow("", null).optional(),
    plan:         Joi.string().valid("starter", "growth", "enterprise").optional(),
    billingCycle: Joi.string().valid("monthly", "yearly").optional(),
  }),
};

// ── Rate limiters ──────────────────────────────────────
// ipKeyGenerator handles IPv4-mapped IPv6 addresses (::ffff:x.x.x.x) correctly.
// Using req.ip directly triggers ERR_ERL_KEY_GEN_IPV6 in express-rate-limit v7+.
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many payment requests. Please wait 15 minutes." },
});

const createOrderLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many order requests. Please wait 5 minutes." },
});

// ══════════════════════════════════════════════════════
// ROUTE INVENTORY
// Used by both the debug endpoint and startup validation.
// ══════════════════════════════════════════════════════
const ROUTE_MANIFEST = [
  { method: "POST",   path: "/api/v1/subscription/webhook/payment",         auth: "public",  ctrl: "sub",    fn: "paymentWebhook"            },
  { method: "POST",   path: "/api/v1/subscription/webhook/paypal",          auth: "public",  ctrl: "paypal", fn: "handleWebhook"             },
  { method: "POST",   path: "/api/v1/subscription/upgrade-request",         auth: "public",  ctrl: "sub",    fn: "upgradeRequest"            },
  { method: "GET",    path: "/api/v1/subscription/debug/routes",            auth: "public",  ctrl: null,     fn: null                        },
  { method: "GET",    path: "/api/v1/subscription/paypal/health",           auth: "public",  ctrl: null,     fn: null                        },
  { method: "GET",    path: "/api/v1/subscription/debug/paypal",            auth: "public",  ctrl: null,     fn: null                        },
  { method: "POST",   path: "/api/v1/subscription/intent",                  auth: "user",    ctrl: "sub",    fn: "createIntent"              },
  { method: "POST",   path: "/api/v1/subscription/confirm-payment",         auth: "user",    ctrl: "sub",    fn: "confirmPayment"            },
  { method: "GET",    path: "/api/v1/subscription/me",                      auth: "user",    ctrl: "sub",    fn: "getMySubscription"         },
  { method: "POST",   path: "/api/v1/subscription/paypal/create-order",     auth: "user",    ctrl: "paypal", fn: "createOrder"               },
  { method: "POST",   path: "/api/v1/subscription/paypal/capture-order",    auth: "user",    ctrl: "paypal", fn: "captureOrder"              },
  { method: "PATCH",  path: "/api/v1/subscription/:id/change-plan",         auth: "user",    ctrl: "sub",    fn: "changePlan"                },
  { method: "PATCH",  path: "/api/v1/subscription/:id/cancel",              auth: "user",    ctrl: "sub",    fn: "cancel"                    },
  { method: "DELETE", path: "/api/v1/subscription/:id/paypal-cancel",       auth: "user",    ctrl: "paypal", fn: "cancelPaypalSubscription"  },
  { method: "PATCH",  path: "/api/v1/subscription/:id/reactivate",          auth: "user",    ctrl: "sub",    fn: "reactivateSubscription"    },
  { method: "GET",    path: "/api/v1/subscription/:id/invoice",             auth: "user",    ctrl: "sub",    fn: "downloadInvoice"           },
  { method: "GET",    path: "/api/v1/subscription/:id/audit",               auth: "user",    ctrl: "sub",    fn: "getAuditLogs"              },
  { method: "GET",    path: "/api/v1/subscription/all",                     auth: "admin",   ctrl: "sub",    fn: "getAll"                    },
  { method: "GET",    path: "/api/v1/subscription/analytics/overview",      auth: "admin",   ctrl: "sub",    fn: "analytics"                 },
  { method: "POST",   path: "/api/v1/subscription/:id/invoice/regenerate",  auth: "admin",   ctrl: "sub",    fn: "regenerateInvoice"         },
  { method: "POST",   path: "/api/v1/subscription/:id/invoice/generate",    auth: "admin",   ctrl: "sub",    fn: "generateInvoice"           },
];

// ══════════════════════════════════════════════════════
// PUBLIC ROUTES
// ══════════════════════════════════════════════════════

// Generic payment webhook (Stripe/Razorpay compatible)
router.post("/webhook/payment", safe("paymentWebhook"));

// PayPal webhook — BEFORE protect; needs raw body set by app.js verify callback
router.post("/webhook/paypal", safePaypal("handleWebhook"));

// Upgrade request from landing page (unauthenticated lead)
router.post(
  "/upgrade-request",
  validate(schemas.upgradeRequest),
  safe("upgradeRequest")
);

// ── Route diagnostics (development only) ──────────────
router.get("/debug/routes", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      message: "Diagnostics not available in production",
    });
  }

  const verified = ROUTE_MANIFEST.map((r) => {
    let status = "OK";
    if (r.ctrl === "sub" && r.fn && typeof ctrl[r.fn] !== "function") {
      status = "MISSING_EXPORT";
    } else if (r.ctrl === "paypal" && r.fn && typeof paypalCtrl[r.fn] !== "function") {
      status = "MISSING_EXPORT";
    } else if (r.ctrl === null) {
      status = "BUILTIN"; // inline handler
    }
    return { ...r, status };
  });

  return res.json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    summary: {
      total:   verified.length,
      ok:      verified.filter((r) => r.status === "OK" || r.status === "BUILTIN").length,
      missing: verified.filter((r) => r.status === "MISSING_EXPORT").length,
    },
    startupIssues: _startupIssues,
    routes: verified,
  });
});

// ── PayPal health / configuration diagnostics ──────────
// Single source of truth: delegate to paypalService.getConfigStatus() so this
// endpoint and the controller pre-flight check can never disagree. The previous
// implementation read process.env independently with different logic, causing
// configured=true here while the service returned configured=false when
// PAYPAL_CURRENCY was absent (the service's _CREDS_OK includes !!CURRENCY;
// the old handler did not check currency at all and masked its absence via
// the `|| "INR"` fallback on line 271).
router.get("/paypal/health", (req, res) => {
  if (!paypalService) {
    return res.status(503).json({
      success: false,
      configured: false,
      issues: ["paypal.service could not be loaded — check server logs"],
    });
  }

  const cfg = paypalService.getConfigStatus();

  const issues = [];
  if (!cfg.clientIdPresent)     issues.push("PAYPAL_CLIENT_ID is not set");
  if (!cfg.clientSecretPresent) issues.push("PAYPAL_CLIENT_SECRET is not set");
  if (!cfg.currencyConfigured)  issues.push("PAYPAL_CURRENCY is not set (set USD for sandbox, INR for production)");
  if (!cfg.webhookIdPresent)    issues.push("PAYPAL_WEBHOOK_ID is not set (webhook signature verification disabled)");

  const isProd = process.env.NODE_ENV === "production";

  return res.status(cfg.configured ? 200 : 503).json({
    success:             cfg.configured,
    configured:          cfg.configured,
    mode:                cfg.mode,
    currency:            cfg.currency,
    webhookVerification: cfg.webhookIdPresent,
    tokenCached:         cfg.tokenCached,
    issues,
    ...(isProd ? {} : {
      clientIdPrefix: cfg.clientIdPrefix,
      baseUrl:        cfg.baseUrl,
    }),
  });
});

// ── PayPal credential diagnostics ─────────────────────
// Returns config status + optional live OAuth token test.
// In production: masked output only. In dev: full details + token test.
router.get("/debug/paypal", async (req, res) => {
  const isProd = process.env.NODE_ENV === "production";

  if (!paypalService) {
    return res.status(503).json({
      success: false,
      errorCode: "PAYPAL_SERVICE_UNAVAILABLE",
      message: "paypal.service could not be loaded",
    });
  }

  const config = paypalService.getConfigStatus();

  // In dev, also attempt a live OAuth token to confirm credentials work
  let tokenTest = null;
  if (!isProd) {
    const testParam = req.query.test !== "false"; // default: run test
    if (testParam) {
      tokenTest = await paypalService.testCredentials();
    }
  }

  const issues = [];
  if (!config.clientIdPresent)     issues.push("PAYPAL_CLIENT_ID is not set or invalid");
  if (!config.clientSecretPresent) issues.push("PAYPAL_CLIENT_SECRET is not set or invalid");
  if (!config.webhookIdPresent)    issues.push("PAYPAL_WEBHOOK_ID is not set (webhook verification disabled)");

  return res.status(config.configured ? 200 : 503).json({
    success: config.configured,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    paypal: {
      configured: config.configured,
      mode: config.mode,
      currency: config.currency,
      baseUrl: config.baseUrl,
      issues,
      // Masked fields always shown
      clientIdPrefix: config.clientIdPrefix,
      clientIdPresent: config.clientIdPresent,
      clientSecretPresent: config.clientSecretPresent,
      webhookIdPresent: config.webhookIdPresent,
      // Token cache state
      tokenCached: config.tokenCached,
      tokenExpiresAt: config.tokenExpiresAt,
    },
    // Live OAuth test result — dev only
    ...(tokenTest ? { tokenTest } : {}),
    // Action item if not configured
    ...(!config.configured
      ? {
          fix: [
            "Add PAYPAL_CLIENT_ID to your .env file",
            "Add PAYPAL_CLIENT_SECRET to your .env file",
            "Get sandbox credentials at https://developer.paypal.com/dashboard/applications/sandbox",
            "Restart the server after updating .env",
          ],
        }
      : {}),
  });
});

// ══════════════════════════════════════════════════════
// AUTH REQUIRED — all routes below need a valid JWT
// ══════════════════════════════════════════════════════
router.use(protect);

// Create subscription intent (choose plan before payment)
router.post(
  "/intent",
  validate(schemas.intent),
  safe("createIntent")
);

// Confirm a manual / non-PayPal payment
router.post("/confirm-payment", safe("confirmPayment"));

// Caller's current active subscription
router.get("/me", safe("getMySubscription"));

// ── PayPal one-time payment flow ──────────────────────
router.post(
  "/paypal/create-order",
  createOrderLimiter,
  validate(schemas.createOrder),
  safePaypal("createOrder")
);

router.post(
  "/paypal/capture-order",
  paymentLimiter,
  validate(schemas.captureOrder),
  safePaypal("captureOrder")
);

// ── Subscription lifecycle ────────────────────────────
router.patch(
  "/:id/change-plan",
  validate(schemas.changePlan),
  safe("changePlan")
);

router.patch("/:id/cancel", safe("cancel"));

router.delete("/:id/paypal-cancel", safePaypal("cancelPaypalSubscription"));

router.patch("/:id/reactivate", safe("reactivateSubscription"));

// Invoice download (owner or admin)
router.get("/:id/invoice", safe("downloadInvoice"));

// Audit trail
router.get("/:id/audit", safe("getAuditLogs"));

// ══════════════════════════════════════════════════════
// ADMIN ONLY — requires admin or superadmin role
// All routes below this line are admin-only
// ══════════════════════════════════════════════════════
router.use(authorize("admin", "superadmin"));

router.get("/all", safe("getAll"));

router.get("/analytics/overview", safe("analytics"));

router.post("/:id/invoice/regenerate", safe("regenerateInvoice"));

router.post("/:id/invoice/generate", safe("generateInvoice"));

module.exports = router;
