const { z } = require("zod");

const tone = z.string().min(1).max(50).default("professional");
const audience = z.string().min(2).max(100).optional();
const wordCount = z.number().int().min(300).max(5000).default(1500);

exports.generateSchema = z.discriminatedUnion("feature", [
  // ── SEO Title Tags ───────────────────────────────────────────
  z.object({
    feature: z.literal("seo_title"),
    keyword: z.string().min(2, "keyword must be at least 2 characters").max(150),
    tone: tone.optional(),
    targetAudience: audience,
  }),

  // ── Meta Descriptions ────────────────────────────────────────
  z.object({
    feature: z.literal("meta_description"),
    keyword: z.string().min(2, "keyword must be at least 2 characters").max(150),
    title: z.string().max(200).optional(),
    tone: tone.optional(),
  }),

  // ── Blog Outline ─────────────────────────────────────────────
  z.object({
    feature: z.literal("blog_outline"),
    topic: z.string().min(5, "topic must be at least 5 characters").max(250),
    tone: tone.optional(),
    targetAudience: audience,
    wordCount: wordCount.optional(),
  }),

  // ── Full Blog Post ───────────────────────────────────────────
  z.object({
    feature: z.literal("blog"),
    topic: z.string().min(5, "topic must be at least 5 characters").max(250),
    outline: z.string().max(5000).optional(),
    tone: tone.optional(),
    targetAudience: audience,
    wordCount: wordCount.optional(),
  }),

  // ── Email Subject Lines ──────────────────────────────────────
  z.object({
    feature: z.literal("email_subject"),
    topic: z.string().min(5, "topic must be at least 5 characters").max(250),
    tone: tone.optional(),
    targetAudience: audience,
  }),

  // ── Email Body ───────────────────────────────────────────────
  z.object({
    feature: z.literal("email"),
    topic: z.string().min(5, "topic must be at least 5 characters").max(250),
    goal: z.string().max(250).optional(),
    tone: tone.optional(),
    targetAudience: audience,
  }),

  // ── Social Media Posts ───────────────────────────────────────
  z.object({
    feature: z.literal("social"),
    topic: z.string().min(5, "topic must be at least 5 characters").max(250),
    platform: z.enum(["LinkedIn", "Twitter/X", "Instagram", "Facebook"]),
    tone: tone.optional(),
    includeHashtags: z.boolean().default(true),
  }),

  // ── Ad Copy ──────────────────────────────────────────────────
  z.object({
    feature: z.literal("ad_copy"),
    product: z.string().min(2, "product must be at least 2 characters").max(250),
    platform: z.enum(["Google Ads", "Meta"]).optional(),
    goal: z.string().max(250).optional(),
    tone: tone.optional(),
    targetAudience: audience,
  }),
]);
