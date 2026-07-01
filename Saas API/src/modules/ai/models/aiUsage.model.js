const mongoose = require("mongoose");

const featureUsage = {
  requests: { type: Number, default: 0 },
  inputTokens: { type: Number, default: 0 },
  outputTokens: { type: Number, default: 0 },
};

const aiUsageSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    month: { type: String, required: true }, // "2026-07"

    totalRequests: { type: Number, default: 0 },
    totalInputTokens: { type: Number, default: 0 },
    totalOutputTokens: { type: Number, default: 0 },

    byFeature: {
      seo_title: featureUsage,
      meta_description: featureUsage,
      blog: featureUsage,
      email: featureUsage,
      social: featureUsage,
      ad_copy: featureUsage,
    },
  },
  { timestamps: true }
);

aiUsageSchema.index({ tenantId: 1, month: 1 }, { unique: true });

// Computed cost estimate (read-only virtual)
// Claude Sonnet 4.6: $3/1M input tokens, $15/1M output tokens
aiUsageSchema.virtual("estimatedCostUSD").get(function () {
  const inputCost = (this.totalInputTokens * 3) / 1_000_000;
  const outputCost = (this.totalOutputTokens * 15) / 1_000_000;
  return parseFloat((inputCost + outputCost).toFixed(4));
});

aiUsageSchema.set("toJSON", { virtuals: true });
aiUsageSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("AIUsage", aiUsageSchema);
