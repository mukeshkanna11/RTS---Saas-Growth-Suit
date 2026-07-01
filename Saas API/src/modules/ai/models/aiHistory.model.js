const mongoose = require("mongoose");

const aiHistorySchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // What type of content was generated
    feature: {
      type: String,
      enum: ["seo_title", "meta_description", "blog", "email", "social", "ad_copy"],
      required: true,
      index: true,
    },

    // The input the user provided
    input: {
      keyword: String,
      topic: String,
      tone: String,
      targetAudience: String,
      additionalContext: String,
    },

    // The AI output
    output: { type: String, required: true },

    // Token tracking for cost management
    tokensUsed: { type: Number, default: 0 },
    model: { type: String, default: "claude-sonnet-4-6" },

    // User actions on the output
    isSaved: { type: Boolean, default: false },
    isCopied: { type: Boolean, default: false },
    rating: { type: Number, min: 1, max: 5 },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

aiHistorySchema.index({ tenantId: 1, feature: 1, createdAt: -1 });
aiHistorySchema.index({ tenantId: 1, userId: 1, createdAt: -1 });

module.exports = mongoose.model("AIHistory", aiHistorySchema);
