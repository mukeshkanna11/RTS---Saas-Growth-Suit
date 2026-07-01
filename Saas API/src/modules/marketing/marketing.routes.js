const express = require("express");
const router = express.Router();

const { createCampaign, getCampaigns, getCampaignById, sendCampaign, updateCampaign, deleteCampaign } = require("./marketing.controller");
const { protect } = require("../../middleware/auth.middleware");
const { generateAIContent, generateSEOTitle } = require("./controllers/aiContent.controller");
const { validate } = require("../../utils/validate");
const { sanitizePromptInputs } = require("../../middleware/promptSanitizer.middleware");
const { aiRequestLogger } = require("../../middleware/aiRequestLogger.middleware");
const { aiContentSchema, seoTitleSchema } = require("./validators/seo.validator");

/* =========================
   CAMPAIGN ROUTES
========================= */
router.post("/campaign", protect, createCampaign);
router.get("/campaign", protect, getCampaigns);
router.get("/campaign/:id", protect, getCampaignById);
router.put("/campaign/:id", protect, updateCampaign);
router.delete("/campaign/:id", protect, deleteCampaign);
router.post("/campaign/:id/send", protect, sendCampaign);

/* =========================
   AI CONTENT ROUTES
========================= */
router.post(
  "/ai-content",
  protect,
  validate(aiContentSchema),
  sanitizePromptInputs,
  aiRequestLogger,
  generateAIContent
);

router.post(
  "/seo-title",
  protect,
  validate(seoTitleSchema),
  sanitizePromptInputs,
  aiRequestLogger,
  generateSEOTitle
);

module.exports = router;
