// ======================================================
// src/modules/subscription/subscription.model.js
// FULL UPDATED SAAS-LEVEL SUBSCRIPTION MODEL
// ======================================================

const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    clientName: {
      type: String,
      required: true,
      trim: true,
    },

    clientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    plan: {
      type: String,
      enum: ["starter", "growth", "enterprise"],
      required: true,
    },

    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },

    amount: {
      type: Number,
      required: true,
    },

    projectsIncluded: {
      type: Number,
      required: true,
    },

    teamMembers: {
      type: Number,
      required: true,
    },

    modules: {
      type: Object,
      required: true,
    },

    renewalDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "cancelled", "expired"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);