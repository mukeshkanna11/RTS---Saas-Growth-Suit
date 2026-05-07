const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    // 🏢 SAAS TENANT
    tenantId: {
      type: String,
      required: true,
      index: true,
    },

    // 📌 DEAL INFO
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    value: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    // 🚦 DEAL STAGE
    stage: {
      type: String,
      enum: [
        "new",
        "contacted",
        "qualified",
        "proposal",
        "negotiation",
        "won",
        "lost",
      ],
      default: "new",
      index: true,
    },

    probability: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },

    // ======================================================
    // 🔗 RELATIONS
    // ======================================================

    // CRM Contact
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      index: true,
    },

    // Lead Source
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      index: true,
    },

    // Employee Assigned
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },

    // Manager/Admin Owner
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },

    // Creator
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    // ======================================================
    // 📅 PIPELINE
    // ======================================================

    expectedCloseDate: {
      type: Date,
    },

    lostReason: {
      type: String,
      default: null,
    },

    // ======================================================
    // 📜 STAGE HISTORY
    // ======================================================

    stageHistory: [
      {
        stage: {
          type: String,
        },

        changedAt: {
          type: Date,
          default: Date.now,
        },

        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    // ======================================================
    // 🗑 SOFT DELETE
    // ======================================================

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ======================================================
// 🚀 PERFORMANCE INDEXES
// ======================================================

schema.index({ tenantId: 1, stage: 1 });

schema.index({ tenantId: 1, createdAt: -1 });

schema.index({ tenantId: 1, assignedTo: 1 });

schema.index({ tenantId: 1, managerId: 1 });

module.exports = mongoose.model("Deal", schema);