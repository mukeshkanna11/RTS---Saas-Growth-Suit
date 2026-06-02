const mongoose = require("mongoose");

const dashboardMetricSchema =
  new mongoose.Schema(
    {
      tenantId: {
        type: String,
        required: true,
      },

      metric: {
        type: String,
        enum: [
          "impressions",
          "clicks",
          "conversions",
        ],
        required: true,
      },

      currentValue: {
        type: Number,
        default: 0,
      },

      previousValue: {
        type: Number,
        default: 0,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "DashboardMetric",
    dashboardMetricSchema
  );