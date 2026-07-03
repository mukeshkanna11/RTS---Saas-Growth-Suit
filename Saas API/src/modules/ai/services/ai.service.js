const { generateStructuredContent } = require("../../../services/claude.service");
const AIHistory = require("../models/aiHistory.model");
const AIUsage = require("../models/aiUsage.model");
const tokenBilling = require("../../../services/tokenBilling.service");
const { aiCache, buildCacheKey, isCacheable, CACHE_TTL } = require("../../../utils/cache");
const { seoTitlePrompt, metaDescriptionPrompt } = require("../prompts/seo.prompts");
const { blogOutlinePrompt, blogPostPrompt } = require("../prompts/blog.prompts");
const { emailSubjectPrompt, emailBodyPrompt, socialPostPrompt, adCopyPrompt } = require("../prompts/content.prompts");

const PROMPT_MAP = {
  seo_title: seoTitlePrompt,
  meta_description: metaDescriptionPrompt,
  blog_outline: blogOutlinePrompt,
  blog: blogPostPrompt,
  email_subject: emailSubjectPrompt,
  email: emailBodyPrompt,
  social: socialPostPrompt,
  ad_copy: adCopyPrompt,
};

const TOKEN_LIMITS = {
  seo_title: 400,
  meta_description: 400,
  blog_outline: 800,
  blog: 4000,
  email_subject: 300,
  email: 1500,
  social: 800,
  ad_copy: 600,
};

// blog_outline saves under "blog" in history (multi-step flow)
const FEATURE_HISTORY_MAP = {
  blog_outline: "blog",
  email_subject: "email",
};

async function generate(tenantId, userId, feature, inputData) {
  const promptFn = PROMPT_MAP[feature];
  if (!promptFn) throw Object.assign(new Error(`Unknown AI feature: ${feature}`), { status: 400 });

  // ── Cache lookup for deterministic features ───────────────────────────────
  const cacheKey = isCacheable(feature) ? buildCacheKey(feature, inputData) : null;
  if (cacheKey) {
    const cached = aiCache.get(cacheKey);
    if (cached) {
      console.log(`[AICache] HIT — feature: ${feature}, key: ${cacheKey.slice(-8)}`);
      return { output: cached, historyId: null, cached: true };
    }
  }

  // ── Generate via Claude ───────────────────────────────────────────────────
  const { system, user } = promptFn(inputData);

  const { text: output, usage } = await generateStructuredContent(system, user, {
    maxTokens: TOKEN_LIMITS[feature] || 2000,
  });

  // ── Store in cache ────────────────────────────────────────────────────────
  if (cacheKey) {
    aiCache.set(cacheKey, output, CACHE_TTL[feature]);
    console.log(`[AICache] SET — feature: ${feature}, key: ${cacheKey.slice(-8)}`);
  }

  const historyFeature = FEATURE_HISTORY_MAP[feature] || feature;

  // ── Persist history ───────────────────────────────────────────────────────
  const history = await AIHistory.create({
    tenantId,
    userId,
    feature: historyFeature,
    input: inputData,
    output,
    model: "claude-sonnet-4-6",
    tokensUsed: usage.totalTokens,
  });

  // ── Update monthly usage (upsert) ─────────────────────────────────────────
  const month = new Date().toISOString().slice(0, 7);
  await AIUsage.findOneAndUpdate(
    { tenantId, month },
    {
      $inc: {
        totalRequests: 1,
        totalInputTokens: usage.inputTokens,
        totalOutputTokens: usage.outputTokens,
        [`byFeature.${historyFeature}.requests`]: 1,
        [`byFeature.${historyFeature}.inputTokens`]: usage.inputTokens,
        [`byFeature.${historyFeature}.outputTokens`]: usage.outputTokens,
      },
    },
    { upsert: true, new: true }
  );

  // ── Log token usage against billing budget (non-blocking, fail-open) ──────
  tokenBilling.getTokenBalance(tenantId).catch((err) => {
    console.error("[TokenBilling] Balance check failed:", err.message);
  });

  return { output, historyId: history._id, cached: false, usage };
}

async function getHistory(tenantId, { feature, page = 1, limit = 20 }) {
  const filter = { tenantId, isDeleted: false };
  if (feature) filter.feature = feature;

  const [items, total] = await Promise.all([
    AIHistory.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-__v")
      .populate("userId", "name email"),
    AIHistory.countDocuments(filter),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

async function getUsage(tenantId) {
  const month = new Date().toISOString().slice(0, 7);
  const usage = await AIUsage.findOne({ tenantId, month });
  return usage || { totalRequests: 0, totalInputTokens: 0, totalOutputTokens: 0, estimatedCostUSD: 0, byFeature: {} };
}

async function deleteHistory(tenantId, historyId) {
  return AIHistory.findOneAndUpdate(
    { _id: historyId, tenantId },
    { isDeleted: true },
    { new: true }
  );
}

// ── Analytics Queries ─────────────────────────────────────────────────────────

async function getAnalyticsSummary(tenantId) {
  const month = new Date().toISOString().slice(0, 7);
  const usage = await AIUsage.findOne({ tenantId, month }).lean();
  if (!usage) return { month, totalRequests: 0, totalTokens: 0, estimatedCostUSD: 0 };
  const inputCost = (usage.totalInputTokens * 3) / 1_000_000;
  const outputCost = (usage.totalOutputTokens * 15) / 1_000_000;
  return {
    month,
    totalRequests: usage.totalRequests,
    totalInputTokens: usage.totalInputTokens,
    totalOutputTokens: usage.totalOutputTokens,
    estimatedCostUSD: parseFloat((inputCost + outputCost).toFixed(4)),
    byFeature: usage.byFeature,
  };
}

async function getDailyRequests(tenantId, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return AIHistory.aggregate([
    { $match: { tenantId: tenantId.toString ? tenantId : tenantId, createdAt: { $gte: since }, isDeleted: false } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          feature: "$feature",
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.date": 1 } },
  ]);
}

async function getTopFeatures(tenantId) {
  return AIHistory.aggregate([
    { $match: { tenantId, isDeleted: false } },
    { $group: { _id: "$feature", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
}

async function getTopUsers(tenantId, limit = 10) {
  return AIHistory.aggregate([
    { $match: { tenantId, isDeleted: false } },
    { $group: { _id: "$userId", count: { $sum: 1 }, tokensUsed: { $sum: "$tokensUsed" } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    { $project: { count: 1, tokensUsed: 1, name: "$user.name", email: "$user.email" } },
  ]);
}

async function getCostBreakdown(tenantId, months = 3) {
  const results = [];
  for (let i = 0; i < months; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const month = d.toISOString().slice(0, 7);
    const usage = await AIUsage.findOne({ tenantId, month }).lean();
    if (usage) {
      const inputCost = (usage.totalInputTokens * 3) / 1_000_000;
      const outputCost = (usage.totalOutputTokens * 15) / 1_000_000;
      results.push({
        month,
        totalRequests: usage.totalRequests,
        totalInputTokens: usage.totalInputTokens,
        totalOutputTokens: usage.totalOutputTokens,
        estimatedCostUSD: parseFloat((inputCost + outputCost).toFixed(4)),
      });
    } else {
      results.push({ month, totalRequests: 0, totalInputTokens: 0, totalOutputTokens: 0, estimatedCostUSD: 0 });
    }
  }
  return results;
}

module.exports = {
  generate,
  getHistory,
  getUsage,
  deleteHistory,
  getAnalyticsSummary,
  getDailyRequests,
  getTopFeatures,
  getTopUsers,
  getCostBreakdown,
};
