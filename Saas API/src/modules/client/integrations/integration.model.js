const mongoose = require("mongoose");

const integrationSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },

    provider: {
      type: String,
      enum: [
        "email",
        "whatsapp",
        "googleAds",
        "metaAds",
        "instagram",
        "linkedin",
      ],
      required: true,
    },

    displayName: {
      type: String,
      required: true,
    },

    isConnected: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "error"],
      default: "inactive",
    },

    credentials: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    settings: {
      autoSync: {
        type: Boolean,
        default: true,
      },

      syncInterval: {
        type: Number,
        default: 60,
      },
    },

    lastSyncedAt: Date,

    connectedBy: {
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

integrationSchema.index({
  tenantId: 1,
  provider: 1,
});

module.exports =
  mongoose.models.Integration ||
  mongoose.model(
    "Integration",
    integrationSchema
  );