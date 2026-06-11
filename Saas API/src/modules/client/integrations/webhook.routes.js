const express = require("express");

const router = express.Router();

const whatsappWebhook = require("./webhooks/whatsapp.webhook");
const instagramWebhook = require("./webhooks/instagram.webhook");
const emailWebhook = require("./webhooks/email.webhook");

/*
================================
WHATSAPP
================================
*/

router.get(
  "/whatsapp",
  whatsappWebhook.verifyWebhook
);

router.post(
  "/whatsapp",
  whatsappWebhook.receiveWebhook
);

/*
================================
INSTAGRAM
================================
*/

router.get(
  "/instagram",
  instagramWebhook.verifyWebhook
);

router.post(
  "/instagram",
  instagramWebhook.receiveWebhook
);

/*
================================
EMAIL
================================
*/

router.post(
  "/email",
  emailWebhook.receiveWebhook
);

module.exports = router;