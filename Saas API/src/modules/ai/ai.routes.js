const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../../middleware/auth.middleware");
const { rateLimitAI } = require("../../middleware/rateLimitAI.middleware");
const { sanitizePromptInputs } = require("../../middleware/promptSanitizer.middleware");
const { aiRequestLogger } = require("../../middleware/aiRequestLogger.middleware");
const { validate } = require("../../utils/validate");
const { generateSchema } = require("../marketing/validators/ai.validator");

const {
  generate,
  getHistory,
  getUsage,
  deleteHistory,
  getAnalyticsSummary,
  getDailyRequests,
  getTopFeatures,
  getTopUsers,
  getCostBreakdown,
} = require("./ai.controller");

// All routes require authentication
router.use(protect);

/* =========================
   GENERATION
========================= */
router.post(
  "/generate",
  rateLimitAI,
  validate(generateSchema),
  sanitizePromptInputs,
  aiRequestLogger,
  generate
);

/* =========================
   HISTORY
========================= */
router.get("/history", getHistory);
router.delete("/history/:id", deleteHistory);

/* =========================
   USAGE (current month)
========================= */
router.get("/usage", authorize("admin", "manager"), getUsage);

/* =========================
   ANALYTICS  (admin/manager only)
========================= */
router.get("/analytics/summary", authorize("admin", "manager"), getAnalyticsSummary);
router.get("/analytics/daily", authorize("admin", "manager"), getDailyRequests);
router.get("/analytics/features", authorize("admin", "manager"), getTopFeatures);
router.get("/analytics/users", authorize("admin", "manager"), getTopUsers);
router.get("/analytics/cost", authorize("admin", "manager"), getCostBreakdown);

module.exports = router;
