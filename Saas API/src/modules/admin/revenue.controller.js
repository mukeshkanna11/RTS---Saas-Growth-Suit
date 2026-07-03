"use strict";

// ======================================================
// revenue.controller.js
// Admin-only revenue analytics dashboard
// ======================================================

const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const Subscription = require("../subscription/subscription.model");
const PaymentTransaction = require("../billing/models/paymentTransaction.model");
const AIUsage = require("../ai/models/aiUsage.model");

// ── Helpers ───────────────────────────────────────────────────────────────────

const getMonthRange = (offsetMonths = 0) => {
  const d = new Date();
  d.setMonth(d.getMonth() - offsetMonths);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end, month: d.toISOString().slice(0, 7) };
};

// ══════════════════════════════════════════════════════
// REVENUE OVERVIEW
// GET /api/v1/admin/revenue/overview
// ══════════════════════════════════════════════════════
exports.getOverview = asyncHandler(async (req, res) => {
  const { start: monthStart, end: monthEnd } = getMonthRange(0);
  const { start: prevStart, end: prevEnd } = getMonthRange(1);

  const [
    totalRevenue,
    monthRevenue,
    prevMonthRevenue,
    activeCount,
    cancelledCount,
    trialCount,
    pendingCount,
  ] = await Promise.all([
    PaymentTransaction.aggregate([
      { $match: { status: "completed", type: { $in: ["subscription_payment", "subscription_renewal", "plan_upgrade"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    PaymentTransaction.aggregate([
      { $match: { status: "completed", createdAt: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    PaymentTransaction.aggregate([
      { $match: { status: "completed", createdAt: { $gte: prevStart, $lte: prevEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Subscription.countDocuments({ status: "active", isDeleted: false }),
    Subscription.countDocuments({ status: "cancelled", isDeleted: false }),
    Subscription.countDocuments({ isTrialActive: true, isDeleted: false }),
    Subscription.countDocuments({ status: "pending", isDeleted: false }),
  ]);

  const thisMonth = monthRevenue[0]?.total || 0;
  const lastMonth = prevMonthRevenue[0]?.total || 0;
  const momGrowth = lastMonth === 0
    ? null
    : parseFloat((((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1));

  return sendSuccess(res, {
    revenue: {
      allTime: totalRevenue[0]?.total || 0,
      thisMonth,
      lastMonth,
      momGrowthPercent: momGrowth,
    },
    subscriptions: {
      active: activeCount,
      cancelled: cancelledCount,
      trial: trialCount,
      pending: pendingCount,
      total: activeCount + cancelledCount + trialCount + pendingCount,
    },
  }, "Revenue overview");
});

// ══════════════════════════════════════════════════════
// MONTHLY RECURRING REVENUE (MRR)
// GET /api/v1/admin/revenue/mrr?months=6
// ══════════════════════════════════════════════════════
exports.getMRR = asyncHandler(async (req, res) => {
  const months = Math.min(24, parseInt(req.query.months) || 6);
  const results = [];

  for (let i = months - 1; i >= 0; i--) {
    const { start, end, month } = getMonthRange(i);
    const agg = await PaymentTransaction.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: start, $lte: end },
          type: { $in: ["subscription_payment", "subscription_renewal", "plan_upgrade", "plan_downgrade"] },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$amount" },
          transactions: { $sum: 1 },
          uniqueCompanies: { $addToSet: "$companyId" },
        },
      },
    ]);

    const row = agg[0] || {};
    results.push({
      month,
      revenue: row.revenue || 0,
      transactions: row.transactions || 0,
      activeCustomers: row.uniqueCompanies?.length || 0,
    });
  }

  return sendSuccess(res, { mrr: results }, "Monthly recurring revenue");
});

// ══════════════════════════════════════════════════════
// REVENUE BY PLAN
// GET /api/v1/admin/revenue/plans
// ══════════════════════════════════════════════════════
exports.getRevenueByPlan = asyncHandler(async (req, res) => {
  const [byPlan, subscriptionsByPlan] = await Promise.all([
    PaymentTransaction.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$plan",
          totalRevenue: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]),
    Subscription.aggregate([
      { $match: { status: "active", isDeleted: false } },
      {
        $group: {
          _id: "$plan",
          count: { $sum: 1 },
          totalMRR: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  // Merge active subscriptions into plan data
  const activeByCycle = Object.fromEntries(
    subscriptionsByPlan.map((s) => [s._id, { activeCount: s.count, mrr: s.totalMRR }])
  );

  const plans = byPlan.map((row) => ({
    plan: row._id,
    totalRevenue: row.totalRevenue,
    transactionCount: row.transactionCount,
    ...( activeByCycle[row._id] || { activeCount: 0, mrr: 0 }),
  }));

  return sendSuccess(res, { plans }, "Revenue by plan");
});

// ══════════════════════════════════════════════════════
// RECENT TRANSACTIONS
// GET /api/v1/admin/revenue/transactions?page=1&limit=20&status=&type=
// ══════════════════════════════════════════════════════
exports.getTransactions = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const { status, type, plan } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (plan) filter.plan = plan;

  const [transactions, total] = await Promise.all([
    PaymentTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-rawPayload")
      .populate("companyId", "name")
      .lean(),
    PaymentTransaction.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }, "Transaction list");
});

// ══════════════════════════════════════════════════════
// AI COST ANALYTICS
// GET /api/v1/admin/revenue/ai-cost?months=3
// Aggregated Claude API usage cost across all tenants
// ══════════════════════════════════════════════════════
exports.getAICost = asyncHandler(async (req, res) => {
  const months = Math.min(12, parseInt(req.query.months) || 3);
  const results = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const month = d.toISOString().slice(0, 7);

    const agg = await AIUsage.aggregate([
      { $match: { month } },
      {
        $group: {
          _id: null,
          totalInputTokens: { $sum: "$totalInputTokens" },
          totalOutputTokens: { $sum: "$totalOutputTokens" },
          totalRequests: { $sum: "$totalRequests" },
          tenantCount: { $sum: 1 },
        },
      },
    ]);

    const row = agg[0] || {};
    const inputCost = ((row.totalInputTokens || 0) * 3) / 1_000_000;
    const outputCost = ((row.totalOutputTokens || 0) * 15) / 1_000_000;

    results.push({
      month,
      totalInputTokens: row.totalInputTokens || 0,
      totalOutputTokens: row.totalOutputTokens || 0,
      totalRequests: row.totalRequests || 0,
      tenantCount: row.tenantCount || 0,
      estimatedCostUSD: parseFloat((inputCost + outputCost).toFixed(4)),
    });
  }

  return sendSuccess(res, { aiCost: results }, "AI cost analytics");
});

// ══════════════════════════════════════════════════════
// CHURN ANALYTICS
// GET /api/v1/admin/revenue/churn?months=6
// ══════════════════════════════════════════════════════
exports.getChurn = asyncHandler(async (req, res) => {
  const months = Math.min(12, parseInt(req.query.months) || 6);
  const results = [];

  for (let i = months - 1; i >= 0; i--) {
    const { start, end, month } = getMonthRange(i);

    const [newSubs, cancelledSubs, renewals] = await Promise.all([
      Subscription.countDocuments({ startedAt: { $gte: start, $lte: end } }),
      Subscription.countDocuments({ cancelledAt: { $gte: start, $lte: end } }),
      PaymentTransaction.countDocuments({
        type: "subscription_renewal",
        status: "completed",
        createdAt: { $gte: start, $lte: end },
      }),
    ]);

    results.push({
      month,
      newSubscriptions: newSubs,
      cancellations: cancelledSubs,
      renewals,
      churnRate: newSubs === 0 ? null : parseFloat(((cancelledSubs / newSubs) * 100).toFixed(1)),
    });
  }

  return sendSuccess(res, { churn: results }, "Churn analytics");
});
