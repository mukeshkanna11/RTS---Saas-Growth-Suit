const mongoose = require("mongoose");

const leadActivitySchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },

    type: {
  type: String,
  enum: [
    "call",
    "email",
    "meeting",
    "note",
    "update",
    "assignment",
    "status",
    "followup",
    "conversion",
    "system"
  ],
  required: true
},

    description: {
      type: String,
    },

    metadata: {
      // 🔥 Flexible future usage
      oldValue: String,
      newValue: String,
      extra: mongoose.Schema.Types.Mixed,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    tenantId: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// 🔥 INDEXING (IMPORTANT)
leadActivitySchema.index({ leadId: 1, createdAt: -1 });
leadActivitySchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model("LeadActivity", leadActivitySchema);