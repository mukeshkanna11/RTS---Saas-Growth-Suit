const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    // 🏢 SAAS TENANT (STANDARDIZED)
    tenantId: {
      type: String,
      index: true,
      required: true,
    },

    title: { type: String, required: true, index: true },

    value: { type: Number, default: 0 },

    currency: { type: String, default: "INR" },

    stage: {
      type: String,
      enum: ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"],
      default: "new",
      index: true,
    },

    probability: { type: Number, default: 10 },

    // 🔗 RELATIONS
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      index: true,
    },

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    // 📅 PIPELINE
    expectedCloseDate: Date,

    lostReason: String,

    stageHistory: [
      {
        stage: String,
        changedAt: Date,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    // 🗑 SOFT DELETE
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
  },
  { timestamps: true }
);

// 🚀 PERFORMANCE INDEXES (SAAS OPTIMIZED)
schema.index({ tenantId: 1, stage: 1 });
schema.index({ tenantId: 1, createdAt: -1 });
schema.index({ tenantId: 1, assignedTo: 1 });

module.exports = mongoose.model("Deal", schema);