const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      select: false,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "manager", "employee", "client"],
      default: "admin",
    },

    tenantId: {
      type: String,
      required: true,
    },

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    refreshTokens: [
      {
        token: String,
        createdAt: Date,
        device: String,
      },
    ],

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 🔒 SaaS-safe uniqueness
userSchema.index({ email: 1, tenantId: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);