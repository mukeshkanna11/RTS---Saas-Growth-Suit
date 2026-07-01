const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess, sendError } = require("../../utils/apiResponse");
const aiService = require("./services/ai.service");

// ── Core Generation ───────────────────────────────────────────────────────────

// POST /api/v1/ai/generate
const generate = asyncHandler(async (req, res) => {
  const { feature, ...inputData } = req.body;
  const { tenantId, id: userId } = req.user;

  const result = await aiService.generate(tenantId, userId, feature, inputData);

  return sendSuccess(res, result, result.cached ? "Retrieved from cache" : "Content generated successfully");
});

// ── History ───────────────────────────────────────────────────────────────────

// GET /api/v1/ai/history
const getHistory = asyncHandler(async (req, res) => {
  const { tenantId } = req.user;
  const { feature, page, limit } = req.query;

  const result = await aiService.getHistory(tenantId, {
    feature,
    page: parseInt(page) || 1,
    limit: Math.min(parseInt(limit) || 20, 100),
  });

  return sendSuccess(res, result, "History retrieved");
});

// GET /api/v1/ai/usage
const getUsage = asyncHandler(async (req, res) => {
  const { tenantId } = req.user;
  const data = await aiService.getUsage(tenantId);
  return sendSuccess(res, data, "Usage retrieved");
});

// DELETE /api/v1/ai/history/:id
const deleteHistory = asyncHandler(async (req, res) => {
  const { tenantId } = req.user;
  await aiService.deleteHistory(tenantId, req.params.id);
  return sendSuccess(res, null, "History item deleted");
});

// ── Analytics ─────────────────────────────────────────────────────────────────

// GET /api/v1/ai/analytics/summary
const getAnalyticsSummary = asyncHandler(async (req, res) => {
  const data = await aiService.getAnalyticsSummary(req.user.tenantId);
  return sendSuccess(res, data, "Analytics summary retrieved");
});

// GET /api/v1/ai/analytics/daily?days=7
const getDailyRequests = asyncHandler(async (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 7, 90);
  const data = await aiService.getDailyRequests(req.user.tenantId, days);
  return sendSuccess(res, { days, breakdown: data }, "Daily request breakdown retrieved");
});

// GET /api/v1/ai/analytics/features
const getTopFeatures = asyncHandler(async (req, res) => {
  const data = await aiService.getTopFeatures(req.user.tenantId);
  return sendSuccess(res, data, "Top features retrieved");
});

// GET /api/v1/ai/analytics/users?limit=10
const getTopUsers = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const data = await aiService.getTopUsers(req.user.tenantId, limit);
  return sendSuccess(res, data, "Top users retrieved");
});

// GET /api/v1/ai/analytics/cost?months=3
const getCostBreakdown = asyncHandler(async (req, res) => {
  const months = Math.min(parseInt(req.query.months) || 3, 12);
  const data = await aiService.getCostBreakdown(req.user.tenantId, months);

  const totalCost = data.reduce((sum, m) => sum + m.estimatedCostUSD, 0);
  return sendSuccess(
    res,
    { months: data, totalEstimatedCostUSD: parseFloat(totalCost.toFixed(4)) },
    "Cost breakdown retrieved"
  );
});

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
