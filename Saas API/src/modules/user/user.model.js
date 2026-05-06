const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    role: {
      type: String,
      enum: ["admin", "manager", "employee"],
      default: "employee",
    },
    tenantId: String,
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    team: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    refreshToken: String,
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 🔥 IMPORTANT EXPORT FIX
module.exports = mongoose.model("User", userSchema);