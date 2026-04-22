const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    tenantId: {
      type: String, // RTS001 (IMPORTANT: STRING not ObjectId)
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["email_sent", "whatsapp_sent", "sms_sent"],
      required: true,
    },

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
    },

    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
    },

    meta: {
      email: String,
      phone: String,
    },

    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },

    error: String,
  },
  { timestamps: true }
);

// SAFE EXPORT (IMPORTANT)
module.exports =
  mongoose.models.Activity ||
  mongoose.model("Activity", activitySchema);