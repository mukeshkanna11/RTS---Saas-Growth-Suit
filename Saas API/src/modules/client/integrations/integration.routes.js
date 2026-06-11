const express = require("express");
const router = express.Router();

const { protect } = require("../../../middleware/auth.middleware");

const controller = require("./integration.controller");

const whatsappWebhook = require("./webhooks/whatsapp.webhook");
const instagramWebhook = require("./webhooks/instagram.webhook");
const emailWebhook = require("./webhooks/email.webhook");

const rateLimit = require("express-rate-limit");

/*
================================
GLOBAL WEBHOOK RATE LIMITER
================================
Protects against spam / abuse
================================
*/
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 60, // limit each IP
  message: {
    success: false,
    message: "Too many webhook requests, please slow down.",
  },
});

/*
================================
BASE ROUTE
================================
*/

router.get("/", protect, controller.getAll);

/*
================================
INTEGRATION MANAGEMENT
================================
*/

router.post("/connect", protect, controller.connect);

router.patch(
  "/disconnect/:provider",
  protect,
  controller.disconnect
);

/*
================================
WHATSAPP WEBHOOK
================================
*/

router
  .route("/webhooks/whatsapp")
  .get(whatsappWebhook.verifyWebhook)
  .post(webhookLimiter, whatsappWebhook.receiveWebhook);

/*
================================
INSTAGRAM WEBHOOK
================================
*/

router
  .route("/webhooks/instagram")
  .get(instagramWebhook.verifyWebhook)
  .post(webhookLimiter, instagramWebhook.receiveWebhook);

/*
================================
EMAIL WEBHOOK
================================
*/

router.post(
  "/webhooks/email",
  webhookLimiter,
  emailWebhook.receiveWebhook
);

/*
================================
SAFE FALLBACK FOR UNKNOWN WEBHOOKS
================================
*/

router.all("/webhooks/*", (req, res) => {
  return res.status(404).json({
    success: false,
    message: "Webhook route not found",
  });
});

module.exports = router;