const AIUsage = require("../modules/ai/models/aiUsage.model");
const Subscription = require("../modules/subscription/subscription.model");

// Per-plan monthly AI request limits (legacy guard — token budget is the primary gate)
const PLAN_LIMITS = {
  starter: 50,
  growth: 200,
  enterprise: Infinity,
};

// Per-feature daily limits to prevent abuse
const FEATURE_DAILY_LIMITS = {
  blog: 5,
  blog_outline: 10,
  seo_title: 30,
  meta_description: 30,
  email: 20,
  email_subject: 30,
  social: 20,
  ad_copy: 20,
};

const rateLimitAI = async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const month = new Date().toISOString().slice(0, 7);

    // ── Resolve actual plan from active subscription (not req.user.plan) ──────
    const sub = await Subscription.findOne({
      companyId: tenantId,
      status: "active",
      isDeleted: false,
    }).select("tokenBudget plan");

    const plan = sub?.plan || "starter";

    // ── 1. Legacy request-count gate ─────────────────────────────────────────
    const monthlyLimit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;

    if (monthlyLimit !== Infinity) {
      const usage = await AIUsage.findOne({ tenantId, month });
      const totalRequests = usage?.totalRequests || 0;

      if (totalRequests >= monthlyLimit) {
        return res.status(429).json({
          success: false,
          message: `Monthly AI request limit reached (${monthlyLimit} requests). Upgrade your plan to continue.`,
          code: "AI_LIMIT_REACHED",
          used: totalRequests,
          limit: monthlyLimit,
        });
      }
    }

    // ── 2. Token budget gate ──────────────────────────────────────────────────
    if (sub && sub.tokenBudget > 0) {
      // tokenBudget > 0 means a finite cap; 0 = unlimited
      const usage = await AIUsage.findOne({ tenantId, month }).select(
        "totalInputTokens totalOutputTokens"
      );
      const tokensUsed =
        (usage?.totalInputTokens || 0) + (usage?.totalOutputTokens || 0);

      if (tokensUsed >= sub.tokenBudget) {
        return res.status(429).json({
          success: false,
          message:
            `Monthly AI token limit reached (${sub.tokenBudget.toLocaleString()} tokens). ` +
            "Upgrade your plan to continue.",
          code: "TOKEN_LIMIT_REACHED",
          used: tokensUsed,
          limit: sub.tokenBudget,
          plan: sub.plan,
        });
      }
    }

    next();
  } catch (err) {
    // Fail open — never block generation on a billing check error
    console.error("[rateLimitAI] Check failed (failing open):", err.message);
    next();
  }
};

module.exports = { rateLimitAI };
