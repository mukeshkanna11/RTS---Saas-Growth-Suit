const mongoose = require("mongoose");

/* =========================================
   CONDITIONS
========================================= */
const conditionSchema = new mongoose.Schema(
  {
    field: String,
    operator: {
      type: String,
      enum: [
        "equals",
        "not_equals",
        "contains",
        "greater_than",
        "less_than",
      ],
    },
    value: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

/* =========================================
   ACTIONS
========================================= */
const actionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "email",
        "whatsapp",
        "notification",
        "alert",
        "webhook",
        "delay",
      ],
      required: true,
    },

    config: {
      subject: String,
      message: String,
      webhookUrl: String,

      delay: {
        value: Number,
        unit: {
          type: String,
          enum: ["minutes", "hours", "days"],
          default: "minutes",
        },
      },
    },
  },
  { _id: false }
);

/* =========================================
   AUTOMATION
========================================= */
const automationSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: String,

    category: {
      type: String,
      enum: [
        "lead",
        "campaign",
        "email",
        "whatsapp",
        "notification",
        "custom",
      ],
      default: "custom",
    },

    trigger: {
      type: {
        type: String,
        required: true,
      },

      source: {
        type: String,
        default: "system",
      },
    },

    conditions: [conditionSchema],

    actions: [actionSchema],

    /* ==========================
       EXECUTION STATS
    ========================== */

    executionCount: {
      type: Number,
      default: 0,
    },

    successCount: {
      type: Number,
      default: 0,
    },

    failureCount: {
      type: Number,
      default: 0,
    },

    lastExecutedAt: Date,

    lastExecutionStatus: {
      type: String,
      enum: [
        "success",
        "failed",
        "pending",
      ],
    },

    /* ==========================
       STATUS
    ========================== */

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

/* =========================================
   INDEXES
========================================= */

automationSchema.index({
  tenantId: 1,
  isActive: 1,
});

automationSchema.index({
  tenantId: 1,
  "trigger.type": 1,
});

module.exports =
  mongoose.models.Automation ||
  mongoose.model(
    "Automation",
    automationSchema
  );