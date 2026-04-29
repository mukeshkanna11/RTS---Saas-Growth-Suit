const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    clientName: String,
    clientEmail: String,

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

    amount: Number,

    status: {
      type: String,
      enum: ["pending", "active", "cancelled", "expired"],
      default: "pending",
    },

    // 🔥 PAYMENT SYSTEM (NEW)
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    transactionId: String,

    renewalDate: Date,

    // limits snapshot
    projectsIncluded: Number,
    teamMembers: Number,
    modules: Object,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);