const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    // 🏢 SAAS TENANT (STANDARD)
    tenantId: {
      type: String,
      index: true,
      required: true,
    },

    // 📌 ACTIVITY CORE
    type: {
      type: String,
      enum: ["call", "meeting", "task", "email", "whatsapp", "note"],
      required: true,
      index: true,
    },

    title: { type: String, trim: true, index: true },

    description: { type: String },

    // ⚡ PRIORITY SYSTEM
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "missed"],
      default: "pending",
      index: true,
    },

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

    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
      index: true,
    },

    // 👤 OWNERSHIP
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    // 📅 TIMING
    dueDate: {
      type: Date,
      index: true,
    },

    completedAt: Date,

    // 🧠 CRM TRACKING
    isOverdue: {
      type: Boolean,
      default: false,
    },

    // 🗑 SOFT DELETE
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// 🚀 SAAS PERFORMANCE INDEXES
schema.index({ tenantId: 1, status: 1 });
schema.index({ tenantId: 1, type: 1 });
schema.index({ tenantId: 1, dueDate: 1 });
schema.index({ tenantId: 1, createdAt: -1 });

/**
 * 🔥 IMPORTANT FIX (NO MORE OVERWRITE ERROR)
 * Rename model + safe check
 */
module.exports =
  mongoose.models.CRMActivity ||
  mongoose.model("CRMActivity", schema);