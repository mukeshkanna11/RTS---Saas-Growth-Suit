const AIUsage = require("../modules/ai/models/aiUsage.model");

// Per-plan monthly AI request limits
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
    const plan = req.user.plan || "starter";
    const monthlyLimit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;

    if (monthlyLimit === Infinity) return next();

    const month = new Date().toISOString().slice(0, 7);
    const usage = await AIUsage.findOne({ tenantId, month });
    const totalRequests = usage?.totalRequests || 0;

    if (totalRequests >= monthlyLimit) {
      return res.status(429).json({
        success: false,
        message: `Monthly AI limit reached (${monthlyLimit} requests). Upgrade your plan to continue.`,
        code: "AI_LIMIT_REACHED",
        used: totalRequests,
        limit: monthlyLimit,
      });
    }

    next();
  } catch (err) {
    // Don't block on rate limit errors — fail open
    next();
  }
};

module.exports = { rateLimitAI };
