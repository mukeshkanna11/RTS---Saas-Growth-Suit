const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    // 🏢 SAAS TENANT (FIX: STRING BASED)
    tenantId: {
      type: String,
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    contactId: { type: mongoose.Schema.Types.ObjectId, ref: "Contact" },
    dealId: { type: mongoose.Schema.Types.ObjectId, ref: "Deal" },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },

    type: {
      type: String,
      enum: ["general", "call", "meeting", "followup", "internal"],
      default: "general",
    },

    isPinned: { type: Boolean, default: false },
    isPrivate: { type: Boolean, default: false },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    editedAt: Date,
  },
  { timestamps: true }
);

schema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model("Note", schema);