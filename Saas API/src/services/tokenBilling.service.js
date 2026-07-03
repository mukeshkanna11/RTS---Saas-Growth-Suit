// ======================================================
// services/tokenBilling.service.js
// AI Token Budget Allocation and Tracking
//
// Design:
//   - tokenBudget on Subscription = allocated tokens/month (0 = unlimited)
//   - Usage is read from AIUsage model (already tracked by ai.service.js)
//   - This service NEVER touches generation logic — it is purely billing
// ======================================================

"use strict";

const Subscription = require("../modules/subscription/subscription.model");
const AIUsage = require("../modules/ai/models/aiUsage.model");
const { getPlan } = require("../modules/subscription/subscription.plans");

// ──────────────────────────────────────────────────────
// ALLOCATE TOKENS
// Called when a subscription becomes active or renews.
// Writes the monthly token budget onto the Subscription doc.
// ──────────────────────────────────────────────────────
const allocateTokens = async (subscriptionId) => {
  const sub = await Subscription.findById(subscriptionId);
  if (!sub) throw new Error(`Subscription ${subscriptionId} not found`);

  const plan = getPlan(sub.plan);
  if (!plan) throw new Error(`Unknown plan key: ${sub.plan}`);

  const budget = plan.aiTokensPerMonth; // 0 = unlimited

  sub.tokenBudget = budget;
  sub.tokensResetAt = new Date();
  await sub.save();

  console.log(
    `[TokenBilling] Allocated ${budget === 0 ? "unlimited" : budget} tokens` +
    ` to subscription ${subscriptionId} (plan: ${sub.plan})`
  );

  return { tokenBudget: budget, plan: sub.plan, subscriptionId };
};

// ──────────────────────────────────────────────────────
// GET TOKEN BALANCE
// Returns current usage vs. budget for a tenant this month.
// tenantId = companyId on the Subscription model.
// ──────────────────────────────────────────────────────
const getTokenBalance = async (tenantId) => {
  const month = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  const [sub, usage] = await Promise.all([
    Subscription.findOne({
      companyId: tenantId,
      status: "active",
      isDeleted: false,
    }).select("tokenBudget plan tokensResetAt"),
    AIUsage.findOne({ tenantId, month }).select(
      "totalInputTokens totalOutputTokens"
    ),
  ]);

  const allocated = sub?.tokenBudget ?? 0;
  const unlimited = allocated === 0; // enterprise / no cap
  const used =
    (usage?.totalInputTokens || 0) + (usage?.totalOutputTokens || 0);
  const remaining = unlimited ? null : Math.max(0, allocated - used);
  const percentUsed =
    unlimited || allocated === 0 ? 0 : Math.round((used / allocated) * 100);

  return {
    allocated,
    used,
    remaining,
    unlimited,
    percentUsed,
    month,
    resetDate: sub?.tokensResetAt || null,
    plan: sub?.plan || null,
  };
};

// ──────────────────────────────────────────────────────
// IS EXHAUSTED
// Returns true when a tenant has used all allocated tokens.
// Enterprise (unlimited) always returns false.
// ──────────────────────────────────────────────────────
const isExhausted = async (tenantId) => {
  const balance = await getTokenBalance(tenantId);

  // No active subscription or unlimited plan
  if (balance.unlimited) return false;

  // No budget set yet (subscription just created, not yet allocated)
  if (balance.allocated === 0) return false;

  return balance.remaining === 0;
};

// ──────────────────────────────────────────────────────
// RESET MONTHLY TOKENS
// Called on subscription renewal.
// Re-reads the current plan and resets the budget.
// ──────────────────────────────────────────────────────
const resetMonthlyTokens = async (subscriptionId) => {
  const sub = await Subscription.findById(subscriptionId);
  if (!sub) throw new Error(`Subscription ${subscriptionId} not found`);

  const plan = getPlan(sub.plan);
  const budget = plan?.aiTokensPerMonth ?? sub.tokenBudget;

  sub.tokenBudget = budget;
  sub.tokensResetAt = new Date();
  await sub.save();

  console.log(
    `[TokenBilling] Reset tokens for subscription ${subscriptionId}` +
    ` — new budget: ${budget === 0 ? "unlimited" : budget}`
  );

  return { tokenBudget: budget };
};

// ──────────────────────────────────────────────────────
// GET USAGE SUMMARY (for dashboard)
// Returns a structured summary suitable for API responses.
// ──────────────────────────────────────────────────────
const getUsageSummary = async (tenantId) => {
  const balance = await getTokenBalance(tenantId);

  return {
    plan: balance.plan,
    month: balance.month,
    tokens: {
      allocated: balance.allocated,
      used: balance.used,
      remaining: balance.remaining,
      unlimited: balance.unlimited,
      percentUsed: balance.percentUsed,
    },
    resetDate: balance.resetDate,
    status:
      balance.unlimited
        ? "unlimited"
        : balance.remaining === 0
        ? "exhausted"
        : balance.percentUsed >= 80
        ? "warning"
        : "healthy",
  };
};

module.exports = {
  allocateTokens,
  getTokenBalance,
  isExhausted,
  resetMonthlyTokens,
  getUsageSummary,
};
