const MarketingCampaign = require("../campaigns/marketing-campaign.model");
const ClientAlert = require("../alerts/client-alert.model");
const ClientNotification = require("../notifications/client-notification.model");
const DashboardMetric = require("../models/dashboard-metric.model");

exports.getDashboardData = async (tenantId) => {
  // ==================================================
  // ALL CAMPAIGNS
  // ==================================================

  const campaigns = await MarketingCampaign.find({
    tenantId,
    isDeleted: false,
  });

  // ==================================================
  // TOTALS
  // ==================================================

  const totals = campaigns.reduce(
    (acc, campaign) => {
      acc.impressions += campaign.impressions || 0;
      acc.clicks += campaign.clicks || 0;
      acc.leads += campaign.leads || 0;
      acc.conversions += campaign.conversions || 0;
      acc.budgetAllocated += campaign.budgetAllocated || 0;
      acc.budgetSpent += campaign.budgetSpent || 0;

      return acc;
    },
    {
      impressions: 0,
      clicks: 0,
      leads: 0,
      conversions: 0,
      budgetAllocated: 0,
      budgetSpent: 0,
    }
  );

  // ==================================================
  // KPI TRENDS
  // ==================================================

  const metrics = await DashboardMetric.find({
    tenantId,
  });

  const kpiTrends = {};

  metrics.forEach((item) => {
    const change =
      item.previousValue > 0
        ? Math.round(
            ((item.currentValue -
              item.previousValue) /
              item.previousValue) *
              100
          )
        : 0;

    kpiTrends[item.metric] = {
      value: item.currentValue,
      previousValue: item.previousValue,
      change,
      trend: change >= 0 ? "up" : "down",
    };
  });

  // ==================================================
  // BUDGET UTILIZATION
  // ==================================================

  const budgetUtilization =
    totals.budgetAllocated > 0
      ? Math.round(
          (totals.budgetSpent /
            totals.budgetAllocated) *
            100
        )
      : 0;

  // ==================================================
  // CHANNEL PERFORMANCE
  // ==================================================

  const rawChannelPerformance =
    await MarketingCampaign.aggregate([
      {
        $match: {
          tenantId,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$channel",

          impressions: {
            $sum: "$impressions",
          },

          clicks: {
            $sum: "$clicks",
          },

          conversions: {
            $sum: "$conversions",
          },
        },
      },
    ]);

  const channelPerformance =
    rawChannelPerformance.map((item) => ({
      channel: item._id,

      impressions: item.impressions,

      clicks: item.clicks,

      conversions: item.conversions,

      percentage:
        totals.impressions > 0
          ? Math.round(
              (item.impressions /
                totals.impressions) *
                100
            )
          : 0,
    }));

  // ==================================================
  // ACTIVE CAMPAIGNS
  // ==================================================

  const campaignsData =
    await MarketingCampaign.find({
      tenantId,
      status: "active",
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(10);

  const activeCampaigns =
    campaignsData.map((campaign) => ({
      id: campaign._id,

      campaignName:
        campaign.campaignName,

      campaignType:
        campaign.campaignType || "Search",

      status: campaign.status,

      budgetSpent:
        campaign.budgetSpent || 0,

      conversionRate:
        campaign.conversionRate || 0,
    }));

  // ==================================================
  // ALERTS
  // ==================================================

  const alerts = await ClientAlert.find({
    tenantId,
  })
    .sort({ createdAt: -1 })
    .limit(5);

  // ==================================================
  // NOTIFICATIONS
  // ==================================================

  const notifications =
    await ClientNotification.find({
      tenantId,
    })
      .sort({ createdAt: -1 })
      .limit(5);

  // ==================================================
  // RESPONSE
  // ==================================================

  return {
    overview: {
      impressions: totals.impressions,
      clicks: totals.clicks,
      leads: totals.leads,
      conversions: totals.conversions,
    },

    kpiTrends,

    budget: {
      allocated: totals.budgetAllocated,
      spent: totals.budgetSpent,
      utilization: budgetUtilization,
    },

    funnel: {
      aware: totals.impressions,
      engaged: totals.clicks,
      lead: totals.leads,
      converted: totals.conversions,
    },

    channelPerformance,

    activeCampaigns,

    alerts,

    notifications,
  };
};