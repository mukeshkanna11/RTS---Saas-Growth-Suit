const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    // 🏢 SAAS TENANT (CORRECT WAY)
    tenantId: {
      type: String,
      required: true,
      index: true,
    },

    // 👤 BASIC INFO
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, index: true },
    phone: { type: String, trim: true },
    company: { type: String },

    // 👨‍💼 OWNERSHIP
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

    // 📊 CRM STATUS
    status: {
      type: String,
      enum: ["new", "active", "inactive", "converted", "lost"],
      default: "new",
      index: true,
    },

    source: { type: String, default: "manual", index: true },

    // 🤖 CRM INTELLIGENCE
    score: { type: Number, default: 0, index: true },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },

    nextAction: { type: String, default: "follow_up" },
    nextActionDate: { type: Date, index: true },

    // 🏷 TAGS
    tags: { type: [String], default: [], index: true },

    notes: { type: String, default: "" },

    // 🗑 SOFT DELETE
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
  },
  { timestamps: true }
);

// 🚀 INDEXES
schema.index({ tenantId: 1, email: 1 });
schema.index({ tenantId: 1, phone: 1 });
schema.index({ tenantId: 1, status: 1 });
schema.index({ tenantId: 1, priority: 1 });

module.exports = mongoose.model("Contact", schema);