const mongoose = require("mongoose");

/**
 * ======================================================
 * ENTERPRISE SAAS SUBSCRIPTION MODEL (FINAL CLEAN)
 * ======================================================
 */

const subscriptionSchema = new mongoose.Schema(
  {
    // ======================================================
    // MULTI-TENANT CORE
    // ======================================================
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "owner",
    },

    // ======================================================
    // CLIENT INFO
    // ======================================================
    clientName: {
      type: String,
      trim: true,
      default: null,
    },

    clientEmail: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
    },

    clientPhone: {
      type: String,
      trim: true,
      default: null,
    },

    // ======================================================
    // PLAN INFO
    // ======================================================
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
      min: 0,
      default: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    // ======================================================
    // STATUS
    // ======================================================
    status: {
      type: String,
      enum: ["pending", "active", "cancelled", "expired", "paused"],
      default: "pending",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    transactionId: {
      type: String,
      default: null,
    },

    paymentGateway: {
      type: String,
      enum: ["manual", "stripe", "razorpay", "paypal"],
      default: "manual",
    },

    // ======================================================
    // BILLING LIFECYCLE
    // ======================================================
    startedAt: {
      type: Date,
      default: Date.now,
    },

    renewalDate: {
      type: Date,
    },

    lastPaymentDate: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    reactivatedAt: {
      type: Date,
      default: null,
    },

    autoRenew: {
      type: Boolean,
      default: true,
    },

    // ======================================================
    // INVOICE SYSTEM (SAFE STRUCTURE)
    // ======================================================
    invoice: {
      invoiceId: {
        type: String,
      },
      url: {
        type: String,
        default: null,
      },
      generatedAt: {
        type: Date,
      },
    },

    // ======================================================
    // PLAN SNAPSHOT
    // ======================================================
    projectsIncluded: { type: Number, default: 0 },
    teamMembers: { type: Number, default: 0 },
    storageGB: { type: Number, default: 0 },
    apiRequestsPerMonth: { type: Number, default: 0 },

    modules: {
      leads: { type: Boolean, default: false },
      crm: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
      automation: { type: Boolean, default: false },
      campaigns: { type: Boolean, default: false },
      erp: { type: Boolean, default: false },
    },

    // ======================================================
    // UPGRADE REQUEST
    // ======================================================
    upgradeRequest: {
      isRequested: { type: Boolean, default: false },
      requestedPlan: {
        type: String,
        enum: ["starter", "growth", "enterprise"],
      },
      message: String,
      whatsappNumber: String,
      status: {
        type: String,
        enum: ["pending", "contacted", "approved", "rejected"],
        default: "pending",
      },
      requestedAt: Date,
      handledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },

    // ======================================================
    // META
    // ======================================================
    meta: {
      source: {
        type: String,
        enum: ["web", "mobile", "api", "admin", "system"],
        default: "web",
      },
      ipAddress: String,
      userAgent: String,
      geoLocation: {
        country: String,
        city: String,
      },
    },

    // ======================================================
    // SOFT DELETE
    // ======================================================
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * ======================================================
 * FINAL INDEX STRATEGY (NO DUPLICATES)
 * ======================================================
 */

// multi-tenant fast queries
subscriptionSchema.index({ companyId: 1, status: 1 });

// billing queries
subscriptionSchema.index({ companyId: 1, paymentStatus: 1 });

// email lookup (login + billing)
subscriptionSchema.index({ clientEmail: 1 });

// renewal queries
subscriptionSchema.index({ renewalDate: 1 });

// invoice search (ONLY ONE TIME - FIXED)
subscriptionSchema.index({ "invoice.invoiceId": 1 });

// upgrade tracking
subscriptionSchema.index({ "upgradeRequest.isRequested": 1 });

// soft delete filter
subscriptionSchema.index({ isDeleted: 1 });

/**
 * ======================================================
 * GLOBAL SOFT DELETE FILTER
 * ======================================================
 */
subscriptionSchema.pre(/^find/, function () {
  this.where({ isDeleted: false });
});

module.exports = mongoose.model("Subscription", subscriptionSchema);