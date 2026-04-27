// ========================================
// analytics.service.js
// ========================================

const Analytics = require("./analytics.model");

class AnalyticsService {
  async createMetric(data) {
    return await Analytics.create(data);
  }

  async getMetrics(companyId, filters = {}) {
    return await Analytics.find({ companyId, ...filters }).sort({
      recordedAt: -1,
    });
  }

  async getDashboardSummary(companyId) {
    const result = await Analytics.aggregate([
      { $match: { companyId } },

      {
        $group: {
          _id: "$category",
          total: { $sum: "$value" },
          avg: { $avg: "$value" },
          count: { $sum: 1 },
        },
      },

      {
        $project: {
          category: "$_id",
          total: 1,
          avg: 1,
          count: 1,
          _id: 0,
        },
      },
    ]);

    return result;
  }

  async getRevenueTrend(companyId) {
    return await Analytics.aggregate([
      {
        $match: {
          companyId,
          category: "revenue",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$recordedAt" },
            month: { $month: "$recordedAt" },
          },
          totalRevenue: { $sum: "$value" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
  }

  async deleteMetric(id, companyId) {
    return await Analytics.findOneAndDelete({ _id: id, companyId });
  }
}

module.exports = new AnalyticsService();
