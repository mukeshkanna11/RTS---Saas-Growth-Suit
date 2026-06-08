const mongoose = require("mongoose");

const clientNotificationSchema =
  new mongoose.Schema(
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

      type: {
        type: String,
        enum: [
          "campaign",
          "lead",
          "alert",
          "automation",
          "system",
          "report",
        ],
        default: "system",
      },

      priority: {
        type: String,
        enum: [
          "low",
          "medium",
          "high",
          "critical",
        ],
        default: "medium",
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
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    {
      timestamps: true,
    }
  );

clientNotificationSchema.index({
  tenantId: 1,
  createdAt: -1,
});

clientNotificationSchema.index({
  tenantId: 1,
  isRead: 1,
});

module.exports =
  mongoose.models.ClientNotification ||
  mongoose.model(
    "ClientNotification",
    clientNotificationSchema
  );