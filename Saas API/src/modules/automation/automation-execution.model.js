const mongoose = require("mongoose");

const automationExecutionSchema =
  new mongoose.Schema(
    {
      tenantId: {
        type: String,
        required: true,
        index: true,
      },

      automationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Automation",
        required: true,
      },

      automationName: {
        type: String,
      },

      trigger: {
        type: String,
        required: true,
      },

      status: {
        type: String,
        enum: [
          "success",
          "failed",
          "pending",
        ],
        default: "success",
      },

      actionsExecuted: {
        type: Number,
        default: 0,
      },

      executionTime: {
        type: Number,
        default: 0,
      },

      errorMessage: {
        type: String,
      },

      payload: {
        type: Object,
      },

      executedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    {
      timestamps: true,
    }
  );

automationExecutionSchema.index({
  tenantId: 1,
  createdAt: -1,
});

module.exports =
  mongoose.models.AutomationExecution ||
  mongoose.model(
    "AutomationExecution",
    automationExecutionSchema
  );