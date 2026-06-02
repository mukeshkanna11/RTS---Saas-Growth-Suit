const mongoose = require("mongoose");

const clientDashboardSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      unique: true,
    },

    aware: {
      type: Number,
      default: 0,
    },

    engaged: {
      type: Number,
      default: 0,
    },

    leads: {
      type: Number,
      default: 0,
    },

    converted: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.ClientDashboard ||
  mongoose.model(
    "ClientDashboard",
    clientDashboardSchema
  );