const Analytics = require("./analytics.model");

class AnalyticsService {
  async createMetric(data) {
    return await Analytics.create(data);
  }

  // 🔥 now receives FULL FILTER (RBAC)
  async getMetrics(filter) {
    return await Analytics.find(filter).sort({
      recordedAt: -1,
    });
  }

  async getDashboardSummary(filter) {
    return await Analytics.aggregate([
      { $match: filter },

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
  }

  async getRevenueTrend(filter) {
    return await Analytics.aggregate([
      {
        $match: {
          ...filter,
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

  async deleteMetric(id, tenantId) {
    return await Analytics.findOneAndDelete({
      _id: id,
      tenantId,
    });
  }
}

module.exports = new AnalyticsService();