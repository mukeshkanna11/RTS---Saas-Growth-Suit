// ========================================
// analytics.model.js (FULL UPDATED SaaS VERSION)
// ========================================

const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    // Multi-tenant support using readable company code
    companyId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // Optional workspace / tenant identifier
    tenantId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },

    // Source of analytics
    source: {
      type: String,
      enum: ["website", "campaign", "crm", "sales", "manual", "api"],
      default: "manual",
    },

    // Category grouping
    category: {
      type: String,
      enum: [
        "lead_generation",
        "conversion",
        "revenue",
        "campaign_performance",
        "user_activity",
        "traffic",
        "engagement",
        "subscription",
      ],
      required: true,
      index: true,
    },

    // Metric title
    metricName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    // Metric numeric value
    value: {
      type: Number,
      required: true,
      default: 0,
    },

    // Unit
    unit: {
      type: String,
      default: "count",
      trim: true,
    },

    // Tags for filtering
    tags: {
      type: [String],
      default: [],
    },

    // Extra metadata
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Date recorded
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // User tracking
    createdBy: {
      type: String,
      default: null,
    },

    // Status for reporting lifecycle
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound indexes for performance
analyticsSchema.index({ companyId: 1, category: 1, recordedAt: -1 });
analyticsSchema.index({ tenantId: 1, source: 1 });

// Virtual field for readable summary
analyticsSchema.virtual("summary").get(function () {
  return `${this.metricName} (${this.category}) = ${this.value} ${this.unit}`;
});

// JSON transform
analyticsSchema.set("toJSON", {
  virtuals: true,
});

// Export model
module.exports = mongoose.model("Analytics", analyticsSchema);