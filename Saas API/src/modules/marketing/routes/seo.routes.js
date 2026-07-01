const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const { generateContent } = require("../../../services/claude.service");
const { validate } = require("../../../utils/validate");
const { sanitizePromptInputs } = require("../../../middleware/promptSanitizer.middleware");
const { sendSuccess, sendError } = require("../../../utils/apiResponse");
const { legacySeoSchema } = require("../validators/seo.validator");

// Dedicated rate limiter for the public (unauthenticated) legacy SEO route
// 20 requests per 15 minutes per IP
const seoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many SEO requests from this IP. Please try again in 15 minutes.",
    data: null,
    errors: null,
    timestamp: new Date().toISOString(),
  },
});

// POST /api/v1/seo/seo-title
// Legacy public endpoint — no auth, strict IP rate limit applied
router.post(
  "/seo-title",
  seoLimiter,
  validate(legacySeoSchema),
  sanitizePromptInputs,
  async (req, res) => {
    try {
      const { keyword } = req.body;

      const prompt = `Generate the single best SEO-optimized title tag for the keyword: "${keyword}".
Rules:
- 50-60 characters
- Include the keyword naturally
- Use a power word if appropriate
- Return only the title, no numbering, no quotes`;

      const { text } = await generateContent(prompt, { maxTokens: 100 });
      return sendSuccess(res, { title: text.trim(), keyword }, "SEO title generated");
    } catch (err) {
      console.error("[SEO Route Error]", err.message);
      return sendError(res, err.message || "SEO title generation failed", err.status || 500);
    }
  }
);

module.exports = router;
