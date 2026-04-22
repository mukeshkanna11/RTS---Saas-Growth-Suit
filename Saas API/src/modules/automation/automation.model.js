const mongoose = require("mongoose");

const actionSchema = new mongoose.Schema({
  type: { type: String, required: true },
  config: {
    subject: String,
    message: String,
    delay: { type: Number, default: 0 }, // minutes
  },
});

const automationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    tenantId: { type: String, required: true },

    trigger: {
      type: {
        type: String,
        required: true,
      },
    },

    actions: [actionSchema],

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Automation", automationSchema);