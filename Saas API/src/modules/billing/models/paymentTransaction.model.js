"use strict";

const mongoose = require("mongoose");

// ======================================================
// PAYMENT TRANSACTION MODEL
// Immutable audit log — one document per payment event.
// Never delete; update status/rawPayload only.
// ======================================================

const paymentTransactionSchema = new mongoose.Schema(
  {
    // ── References ──────────────────────────────────────
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
      index: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // ── Type & Gateway ───────────────────────────────────
    type: {
      type: String,
      enum: [
        "subscription_payment",   // First-time plan purchase
        "subscription_renewal",   // Auto-renewal
        "plan_upgrade",           // Upgrade to higher plan
        "plan_downgrade",         // Downgrade to lower plan
        "refund",                 // Full or partial refund
        "trial_start",            // Trial period activation
        "manual",                 // Admin-recorded manual payment
      ],
      required: true,
      index: true,
    },

    gateway: {
      type: String,
      enum: ["paypal", "manual"],
      default: "paypal",
      index: true,
    },

    // ── Plan Snapshot ────────────────────────────────────
    plan: {
      type: String,
      enum: ["starter", "growth", "enterprise"],
      default: null,
    },

    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: null,
    },

    // ── Amount ───────────────────────────────────────────
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    // ── Dual-Currency Audit Fields ───────────────────────
    // Populated on every payment. When gateway currency = INR these
    // mirror amount/currency. When gateway = USD (sandbox), paymentAmount
    // is the USD charge and invoiceAmount is the INR-converted value used
    // for the GST invoice. exchangeRate is null when no conversion is needed.
    paymentCurrency: { type: String, default: null },
    paymentAmount:   { type: Number, default: null },
    exchangeRate:    { type: Number, default: null },
    invoiceCurrency: { type: String, default: "INR" },
    invoiceAmount:   { type: Number, default: null },

    // ── PayPal References ────────────────────────────────
    paypalOrderId: {
      type: String,
      default: null,
      // index defined below as sparse — do NOT add index:true here (duplicate)
    },

    paypalCaptureId: {
      type: String,
      default: null,
    },

    paypalSubscriptionId: {
      type: String,
      default: null,
      index: true,
    },

    // ── Status ───────────────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    failureReason: {
      type: String,
      default: null,
    },

    // ── Timestamps ───────────────────────────────────────
    processedAt: {
      type: Date,
      default: null,
    },

    // Raw webhook payload — stored for full audit trail.
    // Not exposed to customers; admin-only.
    rawPayload: {
      type: Object,
      default: null,
      select: false, // Hidden by default in queries
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────
paymentTransactionSchema.index({ companyId: 1, createdAt: -1 });
paymentTransactionSchema.index({ status: 1, createdAt: -1 });
paymentTransactionSchema.index({ type: 1, createdAt: -1 });
paymentTransactionSchema.index({ paypalOrderId: 1 }, { sparse: true });
paymentTransactionSchema.index({ paypalCaptureId: 1 }, { sparse: true });

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);
