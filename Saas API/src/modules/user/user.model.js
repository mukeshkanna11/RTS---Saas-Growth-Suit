const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // 👤 Name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // 📧 Email
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    // 🔐 Password
    password: {
      type: String,
      required: true,
      select: false, // 🔥 hide by default
    },

    // 🎭 Role (RBAC)
    role: {
      type: String,
      enum: ["admin", "manager", "employee"],
      default: "employee",
    },

    // 🔥 Tenant ID (STRING — SaaS Friendly)
    tenantId: {
      type: String,
      required: true,
      index: true,
    },

    // 🔐 Refresh Token (for auth system)
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },

    // 🟢 Active / Inactive user
    isActive: {
      type: Boolean,
      default: true,
    },

    // 🗑 Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // 🧾 Optional metadata (future use)
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

// 🔥 Multi-tenant unique constraint
userSchema.index({ email: 1, tenantId: 1 }, { unique: true });

// 🔥 Optional: prevent duplicate indexes in dev reload
// userSchema.set("autoIndex", false);

module.exports = mongoose.model("User", userSchema);