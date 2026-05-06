const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    // BASIC
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    phone: { type: String, index: true },

    // BUSINESS
    companyName: String,
    jobTitle: String,
    website: String,

    // SOURCE
    source: {
      type: String,
      enum: ["website", "facebook", "linkedin", "referral", "google", "ads", "other"],
      default: "other",
    },

    // PIPELINE
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "proposal", "negotiation", "converted", "lost"],
      default: "new",
      index: true,
    },

    pipelineStage: { type: String, default: "New" },

    // SCORING
    score: { type: Number, default: 0 },

    scoreBreakdown: {
      email: { type: Number, default: 0 },
      phone: { type: Number, default: 0 },
      engagement: { type: Number, default: 0 },
      source: { type: Number, default: 0 },
    },

    // 🔥 RBAC STRUCTURE
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    assignedAt: Date,

    // FOLLOW-UP
    followUpDate: { type: Date, index: true },
    lastContactedAt: Date,
    nextAction: String,

    // NOTES
    notes: [
      {
        text: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // CONVERSION
    convertedToCustomer: { type: Boolean, default: false },
    convertedAt: Date,
    dealValue: Number,

    // TENANT
    tenantId: { type: String, required: true, index: true },

    // FLAGS
    isEmailSent: { type: Boolean, default: false },
    isWhatsAppSent: { type: Boolean, default: false },

    // DELETE
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// INDEXES (🔥 IMPORTANT)
leadSchema.index({ tenantId: 1, managerId: 1 });
leadSchema.index({ tenantId: 1, assignedTo: 1 });
leadSchema.index({ tenantId: 1, status: 1 });
leadSchema.index({ tenantId: 1, isDeleted: 1 });
leadSchema.index({ tenantId: 1, createdAt: -1 });

// AUTO SCORING
leadSchema.pre("save", function () {
  let score = 0;

  if (this.email) score += 10;
  if (this.phone) score += 10;
  if (["google", "ads"].includes(this.source)) score += 20;

  this.score = score;

  this.scoreBreakdown = {
    email: this.email ? 10 : 0,
    phone: this.phone ? 10 : 0,
    source: ["google", "ads"].includes(this.source) ? 20 : 0,
    engagement: this.scoreBreakdown?.engagement ?? 0,
  };
});

module.exports = mongoose.model("Lead", leadSchema);