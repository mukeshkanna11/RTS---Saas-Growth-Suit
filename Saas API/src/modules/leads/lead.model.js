const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    // ---------------- BASIC INFO ----------------
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      index: true,
    },

    // ---------------- BUSINESS INFO ----------------
    companyName: String,
    jobTitle: String,
    website: String,

    // ---------------- SOURCE TRACKING ----------------
    source: {
      type: String,
      enum: [
        "website",
        "facebook",
        "linkedin",
        "referral",
        "google",
        "ads",
        "other",
      ],
      default: "other",
    },

    utm: {
      source: String,
      medium: String,
      campaign: String,
    },

    // ---------------- PIPELINE ----------------
    status: {
      type: String,
      enum: [
        "new",
        "contacted",
        "qualified",
        "proposal",
        "negotiation",
        "converted",
        "lost",
      ],
      default: "new",
      index: true,
    },

    pipelineStage: {
      type: String,
      default: "New",
    },

    // ---------------- LEAD SCORING ----------------
    score: {
      type: Number,
      default: 0,
    },

    scoreBreakdown: {
      email: { type: Number, default: 0 },
      phone: { type: Number, default: 0 },
      engagement: { type: Number, default: 0 },
      source: { type: Number, default: 0 },
    },

    // ---------------- TAGS ----------------
    tags: [String],

    // ---------------- ASSIGNMENT ----------------
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    assignedAt: Date,

    // ---------------- FOLLOW-UP ----------------
    followUpDate: {
      type: Date,
      index: true,
    },

    lastContactedAt: Date,
    nextAction: String,

    // ---------------- ACTIVITIES ----------------
    activities: [
      {
        type: String,
        note: String,
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ---------------- NOTES ----------------
    notes: [
      {
        text: String,
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ---------------- CAPTURE ----------------
    capture: {
      page: String,
      formId: String,
      ip: String,
      userAgent: String,
    },

    // ---------------- CONVERSION ----------------
    convertedToCustomer: {
      type: Boolean,
      default: false,
    },

    convertedAt: Date,
    dealValue: Number,

    // ---------------- TENANT ----------------
    tenantId: {
      type: String,
      required: true,
      index: true,
    },

    // ---------------- RELATIONS ----------------
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },

    // ---------------- FLAGS ----------------
    isEmailSent: {
      type: Boolean,
      default: false,
    },

    isWhatsAppSent: {
      type: Boolean,
      default: false,
    },

    // ---------------- SOFT DELETE ----------------
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// ---------------- INDEXES ----------------
leadSchema.index({ tenantId: 1, status: 1 });
leadSchema.index({ tenantId: 1, assignedTo: 1 });
leadSchema.index({ tenantId: 1, followUpDate: 1 });
leadSchema.index({ tenantId: 1, createdAt: -1 });
leadSchema.index({ email: 1, tenantId: 1 });

// ---------------- AUTO SCORING (FIXED 🔥) ----------------
leadSchema.pre("save", function () {
  let score = 0;

  if (this.email) score += 10;
  if (this.phone) score += 10;
  if (this.source === "google" || this.source === "ads") score += 20;

  this.score = score;

  this.scoreBreakdown = {
    email: this.email ? 10 : 0,
    phone: this.phone ? 10 : 0,
    source:
      this.source === "google" || this.source === "ads" ? 20 : 0,
    engagement: this.scoreBreakdown?.engagement || 0,
  };
});

// ---------------- MODEL ----------------
module.exports = mongoose.model("Lead", leadSchema);