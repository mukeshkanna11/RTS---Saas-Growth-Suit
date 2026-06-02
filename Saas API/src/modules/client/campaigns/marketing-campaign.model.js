const mongoose = require("mongoose");

const marketingCampaignSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },

    campaignName: {
      type: String,
      required: true,
      trim: true,
    },
    campaignType: {
  type: String,
  enum: [
    "Search",
    "Meta",
    "Display",
    "LinkedIn",
    "Email",
    "SEO"
  ],
  default: "Search"
},

    channel: {
      type: String,
      enum: [
        "Google Ads",
        "Meta Ads",
        "LinkedIn",
        "Email",
        "SEO",
      ],
      required: true,
    },

    impressions: {
      type: Number,
      default: 0,
    },

    clicks: {
      type: Number,
      default: 0,
    },

    leads: {
      type: Number,
      default: 0,
    },

    conversions: {
      type: Number,
      default: 0,
    },

    budgetAllocated: {
      type: Number,
      default: 0,
    },

    budgetSpent: {
      type: Number,
      default: 0,
    },

    conversionRate: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "paused", "completed"],
      default: "active",
    },

    startDate: Date,

    endDate: Date,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.MarketingCampaign ||
  mongoose.model(
    "MarketingCampaign",
    marketingCampaignSchema
  );