const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String, // RTS001 (your SaaS id)
      required: true,
      index: true,
    },

    name: { type: String, required: true },
    type: { type: String, enum: ["email", "whatsapp"], default: "email" },

    subject: String,
    content: { type: String, required: true },

    status: {
      type: String,
      enum: ["draft", "scheduled", "running", "completed"],
      default: "draft",
    },

    version: {
      type: Number,
      default: 1,
    },

    stats: {
      sent: { type: Number, default: 0 },
      success: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
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
  { timestamps: true }
);

module.exports =
  mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);