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
    // PAYPAL PAYMENT FIELDS
    // ======================================================
    paypalOrderId: {
      type: String,
      default: null,
      index: true,
    },

    paypalSubscriptionId: {
      type: String,
      default: null,
      index: true,
    },

    paypalCustomerId: {
      type: String,
      default: null,
    },

    // ======================================================
    // TRIAL PERIOD
    // ======================================================
    isTrialActive: {
      type: Boolean,
      default: false,
      index: true,
    },

    trialStartsAt: {
      type: Date,
      default: null,
    },

    trialEndsAt: {
      type: Date,
      default: null,
    },

    // ======================================================
    // AI TOKEN BUDGET
    // 0 = unlimited (enterprise); >0 = monthly token cap
    // ======================================================
    tokenBudget: {
      type: Number,
      default: 0,
      min: 0,
    },

    tokensResetAt: {
      type: Date,
      default: null,
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
      ai: { type: Boolean, default: false },
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

// Only ONE active subscription per company at a time.
// Pending subscriptions are intentionally excluded from this constraint:
// each call to createIntent creates a fresh pending document (one per
// checkout session / billing contact). Multiple pending docs are normal
// and get cancelled automatically when any one of them is paid.
// Cancelled, expired, and paused records are also excluded so history
// accumulates freely.
//
// DEPLOYMENT NOTE: if the database still has the old index named
// "unique_active_pending_per_company" (which covered both active and pending),
// drop it before deploying:
//   db.subscriptions.dropIndex("unique_active_pending_per_company")
// The cleanup script (src/scripts/cleanupSubscriptions.js) does this automatically.
subscriptionSchema.index(
  { companyId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status:    "active",
      isDeleted: false,
    },
    name: "unique_active_per_company",
  }
);

/**
 * ======================================================
 * GLOBAL SOFT DELETE FILTER
 * ======================================================
 */
subscriptionSchema.pre(/^find/, function () {
  this.where({ isDeleted: false });
});

module.exports = mongoose.model("Subscription", subscriptionSchema);