// ======================================================
// CONTACT MODEL — ENTERPRISE SAAS CRM (PRODUCTION READY)
// ======================================================

const mongoose = require("mongoose");

// ======================================================
// ATTACHMENT SUB SCHEMA
// ======================================================
const attachmentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      trim: true,
      default: "",
    },

    fileUrl: {
      type: String,
      trim: true,
      default: "",
    },

    fileType: {
      type: String,
      trim: true,
      default: "",
    },

    fileSize: {
      type: Number,
      default: 0,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

// ======================================================
// CONTACT SCHEMA
// ======================================================
const contactSchema = new mongoose.Schema(
  {
    // ==================================================
    // 🏢 MULTI TENANT SUPPORT
    // ==================================================
    tenantId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // ==================================================
    // 👤 BASIC CONTACT INFO
    // ==================================================
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    alternatePhone: {
      type: String,
      trim: true,
      default: "",
    },

    company: {
      type: String,
      trim: true,
      default: "",
    },

    designation: {
      type: String,
      trim: true,
      default: "",
    },

    website: {
      type: String,
      trim: true,
      default: "",
    },

    // ==================================================
    // 🌍 ADDRESS DETAILS
    // ==================================================
    address: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    country: {
      type: String,
      trim: true,
      default: "",
    },

    postalCode: {
      type: String,
      trim: true,
      default: "",
    },

    // ==================================================
    // 👨‍💼 OWNERSHIP & TEAM MANAGEMENT
    // ==================================================
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ==================================================
    // 📊 CRM SALES PIPELINE
    // ==================================================
    status: {
      type: String,
      enum: [
        "new",
        "active",
        "qualified",
        "proposal",
        "converted",
        "inactive",
        "lost",
      ],
      default: "new",
      index: true,
    },

    source: {
      type: String,
      enum: [
        "manual",
        "website",
        "facebook",
        "instagram",
        "linkedin",
        "whatsapp",
        "email",
        "referral",
        "campaign",
        "api",
      ],
      default: "manual",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },

    // ==================================================
    // 🤖 SALES INTELLIGENCE
    // ==================================================
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    estimatedValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    probability: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ==================================================
    // 📅 FOLLOW UP MANAGEMENT
    // ==================================================
    nextAction: {
      type: String,
      default: "follow_up",
    },

    nextActionDate: {
      type: Date,
      default: null,
      index: true,
    },

    lastContactedAt: {
      type: Date,
      default: null,
    },

    // ==================================================
    // 🏷 TAGGING SYSTEM
    // ==================================================
    tags: {
      type: [String],
      default: [],
    },

    notes: {
      type: String,
      default: "",
      maxlength: 5000,
    },

    // ==================================================
    // 📎 FILE ATTACHMENTS
    // ==================================================
    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    // ==================================================
    // 🧩 CUSTOM FIELDS
    // ==================================================
    customFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ==================================================
    // 📈 ANALYTICS
    // ==================================================
    totalInteractions: {
      type: Number,
      default: 0,
    },

    lastInteractionType: {
      type: String,
      default: "",
    },

    // ==================================================
    // 🔒 SOFT DELETE SYSTEM
    // ==================================================
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ======================================================
// 🚀 ENTERPRISE INDEXES
// ======================================================

// EMAIL LOOKUP
contactSchema.index(
  { tenantId: 1, email: 1 },
  { background: true }
);

// PHONE LOOKUP
contactSchema.index(
  { tenantId: 1, phone: 1 },
  { background: true }
);

// STATUS FILTERING
contactSchema.index(
  { tenantId: 1, status: 1 },
  { background: true }
);

// PRIORITY FILTERING
contactSchema.index(
  { tenantId: 1, priority: 1 },
  { background: true }
);

// TEAM OWNERSHIP
contactSchema.index(
  { tenantId: 1, owner: 1 },
  { background: true }
);

// ASSIGNED USERS
contactSchema.index(
  { tenantId: 1, assignedTo: 1 },
  { background: true }
);

// ANALYTICS
contactSchema.index(
  { createdAt: -1 },
  { background: true }
);

contactSchema.index(
  { score: -1 },
  { background: true }
);

// FULL TEXT SEARCH
contactSchema.index(
  {
    name: "text",
    email: "text",
    company: "text",
    phone: "text",
  },
  { background: true }
);

// ======================================================
// 🧠 PRE SAVE HOOKS
// ======================================================
contactSchema.pre("save", function () {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }

  if (this.name) {
    this.name = this.name.trim();
  }

  if (this.company) {
    this.company = this.company.trim();
  }
});

// ======================================================
// 🔍 AUTO FILTER SOFT DELETED RECORDS
// ======================================================
contactSchema.pre(/^find/, function () {
  this.where({
    isDeleted: false,
  });
});

// ======================================================
// 📦 EXPORT MODEL
// ======================================================
module.exports = mongoose.model("Contact", contactSchema);