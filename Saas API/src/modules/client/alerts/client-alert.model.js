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
    },

    message: {
      type: String,
      required: true,
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    isRead: {
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

module.exports =
  mongoose.models.ClientAlert ||
  mongoose.model(
    "ClientAlert",
    clientAlertSchema
  );