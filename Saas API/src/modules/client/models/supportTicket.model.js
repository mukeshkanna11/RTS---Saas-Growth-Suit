const mongoose = require("mongoose");

const SupportTicketSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    adminReply: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "NEW",
        "IN_PROGRESS",
        "RESOLVED",
      ],
      default: "NEW",
    },

    repliedAt: Date,

    resolvedAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "SupportTicket",
  SupportTicketSchema
);