const { generateStructuredContent } = require("../../../services/claude.service");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess, sendError } = require("../../../utils/apiResponse");

const CONTENT_SYSTEM = `You are an expert content writer and marketing specialist.
Write high-quality, engaging content optimized for the specified use case.
Respond with ONLY the requested content — no preamble, no meta-commentary.`;

const SEO_SYSTEM = `You are an expert SEO strategist with deep knowledge of Google ranking factors.
Generate SEO-optimized copy that balances keyword placement with natural readability.
Respond with ONLY the requested output — no explanations, no markdown formatting.`;

// POST /api/v1/marketing/ai-content
const generateAIContent = asyncHandler(async (req, res) => {
  const { contentType = "general", topic, tone = "Professional", context } = req.body;

  const typeLabels = {
    blog: "a blog post",
    email: "marketing email copy",
    social: "social media posts",
    ad: "ad copy",
    general: "content",
  };

  const userPrompt = `Write ${typeLabels[contentType] || "content"} about: "${topic}"
Tone: ${tone}${context ? `\nAdditional context: ${context}` : ""}`;

  const { text, usage } = await generateStructuredContent(CONTENT_SYSTEM, userPrompt, { maxTokens: 2000 });

  return sendSuccess(res, { content: text, usage }, "Content generated successfully");
});

// POST /api/v1/marketing/seo-title
const generateSEOTitle = asyncHandler(async (req, res) => {
  const { keyword, tone = "Professional", targetAudience, type } = req.body;

  const isMetaDescription = type === "meta_description";

  const userPrompt = isMetaDescription
    ? `Generate 3 meta descriptions for keyword: "${keyword}"
Rules:
- Each description 150-160 characters
- Include keyword naturally
- End with a soft CTA
- Tone: ${tone}${targetAudience ? `\n- Target audience: ${targetAudience}` : ""}
- Number each 1-3, one per line`
    : `Generate 5 SEO-optimized title tags for keyword: "${keyword}"
Rules:
- Each title 50-60 characters
- Include keyword naturally
- Tone: ${tone}${targetAudience ? `\n- Target audience: ${targetAudience}` : ""}
- Use power words where appropriate
- Number each title 1-5, one per line`;

  const { text, usage } = await generateStructuredContent(SEO_SYSTEM, userPrompt, {
    maxTokens: isMetaDescription ? 500 : 400,
  });

  const label = isMetaDescription ? "Meta descriptions generated" : "SEO titles generated";
  return sendSuccess(res, { result: text, type: isMetaDescription ? "meta_description" : "seo_title", usage }, label);
});

module.exports = { generateAIContent, generateSEOTitle };
