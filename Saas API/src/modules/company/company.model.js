const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    // 🏢 Company Name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // 🔥 Custom Tenant ID (RTS001)
    tenantId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    // 🌐 Slug (for subdomain: readytech.yourapp.com)
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // 💳 Subscription Plan
    plan: {
      type: String,
      enum: ["starter", "growth", "enterprise"],
      default: "starter",
    },

    // 👑 Owner (Admin User)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // 👥 Max users allowed (plan-based)
    maxUsers: {
      type: Number,
      default: 5,
    },

    // 📊 Usage tracking
    usage: {
      users: { type: Number, default: 0 },
    },

    // 🟢 Active / Suspended
    isActive: {
      type: Boolean,
      default: true,
    },

    // 🗑 Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // 🧾 Extra metadata (future use)
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Company", companySchema);