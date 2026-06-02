const mongoose = require("mongoose");

const clientReportSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },

    reportName: {
      type: String,
      required: true,
      trim: true,
    },

    reportType: {
      type: String,
      enum: ["daily", "weekly", "monthly", "custom"],
      default: "monthly",
    },

    status: {
      type: String,
      enum: ["processing", "ready", "failed"],
      default: "ready",
    },

    fileUrl: {
      type: String,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.ClientReport ||
  mongoose.model(
    "ClientReport",
    clientReportSchema
  );