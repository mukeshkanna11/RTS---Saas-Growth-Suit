const { z } = require("zod");

exports.seoTitleSchema = z.object({
  keyword: z.string().min(2, "keyword must be at least 2 characters").max(150),
  tone: z.string().min(1).max(50).default("Professional"),
  targetAudience: z.string().max(100).optional(),
  type: z.enum(["seo_title", "meta_description"]).optional(),
});

exports.aiContentSchema = z.object({
  topic: z.string().min(3, "topic must be at least 3 characters").max(300),
  contentType: z.enum(["blog", "email", "social", "ad", "general"]).default("general"),
  tone: z.string().min(1).max(50).default("Professional"),
  context: z.string().max(500).optional(),
});

exports.legacySeoSchema = z.object({
  keyword: z.string().min(2, "keyword must be at least 2 characters").max(150),
});
