const mongoose = require("mongoose");

const IntegrationSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },

    provider: {
      type: String,
      enum: ["whatsapp", "email", "instagram"],
      required: true,
    },

    displayName: {
      type: String,
      default: "",
    },

    connected: {
      type: Boolean,
      default: false,
    },

    credentials: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    status: {
      type: String,
      enum: ["healthy", "warning", "error"],
      default: "healthy",
    },

    usageCount: {
      type: Number,
      default: 0,
    },

    lastSync: Date,

    connectedAt: Date,

    disconnectedAt: Date,
  },
  {
    timestamps: true,
  }
);

IntegrationSchema.index({
  tenantId: 1,
  provider: 1,
});

module.exports = mongoose.model(
  "Integration",
  IntegrationSchema
);