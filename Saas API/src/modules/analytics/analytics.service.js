// =======================================================
// analytics.service.js
// FULL ENTERPRISE SAAS SERVICE
// =======================================================

const mongoose = require("mongoose");

const Analytics = require("./analytics.model");

class AnalyticsService {
  // =====================================================
  // CREATE METRIC
  // =====================================================

  async createMetric(data) {
    return await Analytics.create(data);
  }

  // =====================================================
  // GET ALL METRICS
  // =====================================================

  async getMetrics(filter, query = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = "recordedAt",
      order = "desc",
    } = query;

    const skip =
      (Number(page) - 1) * Number(limit);

    const sort = {
      [sortBy]: order === "asc" ? 1 : -1,
    };

    const [metrics, total] = await Promise.all([
      Analytics.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),

      Analytics.countDocuments(filter),
    ]);

    return {
      metrics,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(
          total / Number(limit)
        ),
      },
    };
  }

  // =====================================================
  // GET SINGLE METRIC
  // =====================================================

  async getMetricById(id, filter) {
    return await Analytics.findOne({
      _id: id,
      ...filter,
    });
  }

  // =====================================================
  // UPDATE METRIC
  // =====================================================

  async updateMetric(
    id,
    payload,
    filter,
    userId
  ) {
    return await Analytics.findOneAndUpdate(
      {
        _id: id,
        ...filter,
      },
      {
        ...payload,
        updatedBy: userId,
      },
      {
        new: true,
        runValidators: true,
      }
    );
  }

  // =====================================================
  // DASHBOARD SUMMARY
  // =====================================================

  async getDashboardSummary(filter) {
    const result = await Analytics.aggregate([
      {
        $match: filter,
      },

      {
        $group: {
          _id: "$category",

          totalValue: {
            $sum: "$value",
          },

          avgValue: {
            $avg: "$value",
          },

          count: {
            $sum: 1,
          },

          latestRecordedAt: {
            $max: "$recordedAt",
          },
        },
      },

      {
        $project: {
          _id: 0,
          category: "$_id",
          totalValue: 1,
          avgValue: {
            $round: ["$avgValue", 2],
          },
          count: 1,
          latestRecordedAt: 1,
        },
      },

      {
        $sort: {
          totalValue: -1,
        },
      },
    ]);

    return result;
  }

  // =====================================================
  // REVENUE TREND
  // =====================================================

  async getRevenueTrend(
    filter,
    query = {}
  ) {
    const {
      period = "monthly",
    } = query;

    let groupFormat = {};

    if (period === "daily") {
      groupFormat = {
        year: { $year: "$recordedAt" },
        month: { $month: "$recordedAt" },
        day: { $dayOfMonth: "$recordedAt" },
      };
    } else {
      groupFormat = {
        year: { $year: "$recordedAt" },
        month: { $month: "$recordedAt" },
      };
    }

    return await Analytics.aggregate([
      {
        $match: {
          ...filter,
          category: "revenue",
        },
      },

      {
        $group: {
          _id: groupFormat,

          totalRevenue: {
            $sum: "$value",
          },

          avgRevenue: {
            $avg: "$value",
          },

          entries: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);
  }

  // =====================================================
  // ARCHIVE METRIC
  // =====================================================

  async archiveMetric(id, filter) {
    return await Analytics.findOneAndUpdate(
      {
        _id: id,
        ...filter,
      },
      {
        status: "archived",
        archivedAt: new Date(),
      },
      {
        new: true,
      }
    );
  }

  // =====================================================
  // SOFT DELETE
  // =====================================================

  async deleteMetric(id, tenantId) {
    return await Analytics.findOneAndUpdate(
      {
        _id: id,
        tenantId,
      },
      {
        isDeleted: true,
      },
      {
        new: true,
      }
    );
  }
}

module.exports = new AnalyticsService();