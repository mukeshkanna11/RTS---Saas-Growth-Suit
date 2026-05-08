// =======================================================
// analytics.model.js
// FULL ENTERPRISE SAAS + GROWTH SUITE MODEL
// =======================================================

const mongoose = require("mongoose");

// =======================================================
// ANALYTICS SCHEMA
// =======================================================

const analyticsSchema = new mongoose.Schema(
  {
    // ===================================================
    // MULTI TENANT
    // ===================================================

    companyId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    tenantId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    workspaceId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },

    // ===================================================
    // SOURCE DETAILS
    // ===================================================

    source: {
      type: String,
      enum: [
        "website",
        "campaign",
        "crm",
        "sales",
        "manual",
        "api",
        "mobile_app",
        "integration",
      ],
      default: "manual",
      index: true,
    },

    platform: {
      type: String,
      default: null,
      trim: true,
    },

    // ===================================================
    // CATEGORY
    // ===================================================

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
        "retention",
        "sales_pipeline",
        "customer_success",
      ],
      required: true,
      index: true,
    },

    // ===================================================
    // METRIC INFORMATION
    // ===================================================

    metricName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
      index: true,
    },

    metricCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
      index: true,
    },

    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    value: {
      type: Number,
      required: true,
      default: 0,
    },

    previousValue: {
      type: Number,
      default: 0,
    },

    targetValue: {
      type: Number,
      default: null,
    },

    growthPercentage: {
      type: Number,
      default: 0,
    },

    trend: {
      type: String,
      enum: ["up", "down", "stable"],
      default: "stable",
    },

    unit: {
      type: String,
      default: "count",
      trim: true,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    // ===================================================
    // SEGMENTATION
    // ===================================================

    department: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },

    teamId: {
      type: String,
      default: null,
      index: true,
    },

    campaignId: {
      type: String,
      default: null,
      index: true,
    },

    leadId: {
      type: String,
      default: null,
      index: true,
    },

    customerId: {
      type: String,
      default: null,
      index: true,
    },

    assignedTo: {
      type: String,
      default: null,
      index: true,
    },

    // ===================================================
    // TAGS & LABELS
    // ===================================================

    tags: {
      type: [String],
      default: [],
      index: true,
    },

    labels: {
      type: [String],
      default: [],
    },

    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ===================================================
    // GEO / DEVICE ANALYTICS
    // ===================================================

    country: {
      type: String,
      default: null,
    },

    state: {
      type: String,
      default: null,
    },

    city: {
      type: String,
      default: null,
    },

    device: {
      type: String,
      enum: [
        "desktop",
        "mobile",
        "tablet",
        "server",
        "other",
      ],
      default: "other",
    },

    browser: {
      type: String,
      default: null,
    },

    os: {
      type: String,
      default: null,
    },

    // ===================================================
    // RECORD TIMING
    // ===================================================

    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    periodType: {
      type: String,
      enum: [
        "hourly",
        "daily",
        "weekly",
        "monthly",
        "yearly",
      ],
      default: "daily",
    },

    // ===================================================
    // RBAC TRACKING
    // ===================================================

    createdBy: {
      type: String,
      required: true,
      index: true,
    },

    managerId: {
      type: String,
      default: null,
      index: true,
    },

    updatedBy: {
      type: String,
      default: null,
    },

    // ===================================================
    // STATUS
    // ===================================================

    status: {
      type: String,
      enum: [
        "active",
        "archived",
        "draft",
      ],
      default: "active",
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// =======================================================
// INDEXES
// =======================================================

analyticsSchema.index({
  tenantId: 1,
  category: 1,
  recordedAt: -1,
});

analyticsSchema.index({
  tenantId: 1,
  metricName: 1,
});

analyticsSchema.index({
  tenantId: 1,
  source: 1,
});

analyticsSchema.index({
  tenantId: 1,
  createdBy: 1,
});

analyticsSchema.index({
  tenantId: 1,
  managerId: 1,
});

analyticsSchema.index({
  tenantId: 1,
  campaignId: 1,
});

analyticsSchema.index({
  tenantId: 1,
  status: 1,
});

analyticsSchema.index({
  tenantId: 1,
  assignedTo: 1,
});

// =======================================================
// VIRTUALS
// =======================================================

analyticsSchema.virtual("summary").get(
  function () {
    return `${this.metricName} (${this.category}) = ${this.value} ${this.unit}`;
  }
);

analyticsSchema.virtual("growthLabel").get(
  function () {
    return `${this.growthPercentage}%`;
  }
);

// =======================================================
// PRE SAVE HOOK
// =======================================================

analyticsSchema.pre("save", function () {
  // ==========================================
  // CALCULATE GROWTH
  // ==========================================

  if (
    this.previousValue !== null &&
    this.previousValue !== undefined &&
    this.previousValue > 0
  ) {
    const growth =
      ((this.value - this.previousValue) /
        this.previousValue) *
      100;

    this.growthPercentage = Number(
      growth.toFixed(2)
    );

    // ========================================
    // TREND DETECTION
    // ========================================

    if (growth > 0) {
      this.trend = "up";
    } else if (growth < 0) {
      this.trend = "down";
    } else {
      this.trend = "stable";
    }
  } else {
    this.growthPercentage = 0;
    this.trend = "stable";
  }
});

// =======================================================
// TO JSON
// =======================================================

analyticsSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;

    return ret;
  },
});

// =======================================================
// EXPORT
// =======================================================

module.exports = mongoose.model(
  "Analytics",
  analyticsSchema
);