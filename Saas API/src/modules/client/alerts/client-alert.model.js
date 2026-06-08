const mongoose = require("mongoose");

const clientAlertSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    severity: {
      type: String,
      enum: [
        "low",
        "medium",
        "high",
        "critical",
      ],
      default: "low",
    },

    category: {
      type: String,
      enum: [
        "campaign",
        "budget",
        "lead",
        "automation",
        "system",
      ],
      default: "system",
    },

    actionUrl: {
      type: String,
      default: null,
    },

    metadata: {
      type: Object,
      default: {},
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    isArchived: {
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

clientAlertSchema.index({
  tenantId: 1,
  createdAt: -1,
});

clientAlertSchema.index({
  tenantId: 1,
  isRead: 1,
});

module.exports =
  mongoose.models.ClientAlert ||
  mongoose.model(
    "ClientAlert",
    clientAlertSchema
  );