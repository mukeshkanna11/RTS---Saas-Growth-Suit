const MarketingCampaign = require(
  "../campaigns/marketing-campaign.model"
);

const ClientAlert = require(
  "../alerts/client-alert.model"
);

const ClientNotification = require(
  "../notifications/client-notification.model"
);

const DashboardMetric = require(
  "../models/dashboard-metric.model"
);

const Lead = require(
  "../../leads/lead.model"
);

exports.getDashboardData =
  async (tenantId) => {

    const campaigns =
      await MarketingCampaign.find({
        tenantId,
        isDeleted: false,
      });

    const totals =
      campaigns.reduce(
        (acc, campaign) => {
          acc.impressions +=
            campaign.impressions || 0;

          acc.clicks +=
            campaign.clicks || 0;

          acc.leads +=
            campaign.leads || 0;

          acc.conversions +=
            campaign.conversions || 0;

          acc.budgetAllocated +=
            campaign.budgetAllocated || 0;

          acc.budgetSpent +=
            campaign.budgetSpent || 0;

          acc.revenue +=
            campaign.revenue || 0;

          return acc;
        },
        {
          impressions: 0,
          clicks: 0,
          leads: 0,
          conversions: 0,
          budgetAllocated: 0,
          budgetSpent: 0,
          revenue: 0,
        }
      );

    const ctr =
      totals.impressions > 0
        ? Number(
            (
              (totals.clicks /
                totals.impressions) *
              100
            ).toFixed(2)
          )
        : 0;

    const conversionRate =
      totals.clicks > 0
        ? Number(
            (
              (totals.conversions /
                totals.clicks) *
              100
            ).toFixed(2)
          )
        : 0;

    const cpl =
      totals.leads > 0
        ? Number(
            (
              totals.budgetSpent /
              totals.leads
            ).toFixed(2)
          )
        : 0;

    const roas =
      totals.budgetSpent > 0
        ? Number(
            (
              totals.revenue /
              totals.budgetSpent
            ).toFixed(2)
          )
        : 0;

    const budgetUtilization =
      totals.budgetAllocated > 0
        ? Math.round(
            (totals.budgetSpent /
              totals.budgetAllocated) *
              100
          )
        : 0;

    const channelPerformance =
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
              $sum:
                "$impressions",
            },
            clicks: {
              $sum: "$clicks",
            },
            conversions: {
              $sum:
                "$conversions",
            },
          },
        },
      ]);

    const activeCampaigns =
      await MarketingCampaign.find({
        tenantId,
        status: "active",
        isDeleted: false,
      })
        .sort({
          createdAt: -1,
        })
        .limit(10);

    const recentLeads =
      await Lead.find({
        tenantId,
        isDeleted: false,
      })
        .sort({
          createdAt: -1,
        })
        .limit(5);

    const alerts =
      await ClientAlert.find({
        tenantId,
      })
        .sort({
          createdAt: -1,
        })
        .limit(5);

    const notifications =
      await ClientNotification.find(
        {
          tenantId,
        }
      )
        .sort({
          createdAt: -1,
        })
        .limit(5);

    const topCampaign =
      campaigns.sort(
        (a, b) =>
          (b.conversions || 0) -
          (a.conversions || 0)
      )[0] || null;

    const kpiMetrics =
      await DashboardMetric.find({
        tenantId,
      });

    const kpiTrends = {};

    kpiMetrics.forEach(
      (metric) => {
        const change =
          metric.previousValue > 0
            ? Math.round(
                ((metric.currentValue -
                  metric.previousValue) /
                  metric.previousValue) *
                  100
              )
            : 0;

        kpiTrends[
          metric.metric
        ] = {
          current:
            metric.currentValue,
          previous:
            metric.previousValue,
          change,
          trend:
            change >= 0
              ? "up"
              : "down",
        };
      }
    );

    return {
      overview: {
        impressions:
          totals.impressions,
        clicks:
          totals.clicks,
        leads: totals.leads,
        conversions:
          totals.conversions,
      },

      performance: {
        ctr,
        conversionRate,
        cpl,
        roas,
      },

      budget: {
        allocated:
          totals.budgetAllocated,
        spent:
          totals.budgetSpent,
        utilization:
          budgetUtilization,
      },

      funnel: {
        aware:
          totals.impressions,
        engaged:
          totals.clicks,
        lead: totals.leads,
        converted:
          totals.conversions,
      },

      kpiTrends,

      channelPerformance,

      activeCampaigns,

      recentLeads,

      topCampaign,

      alerts,

      notifications,

      email: {
        sent: 0,
        opened: 0,
        clicked: 0,
      },

      whatsapp: {
        sent: 0,
        delivered: 0,
        read: 0,
      },
    };
  };

exports.getGrowthAnalytics =
  async (tenantId) => {

    const campaigns =
      await MarketingCampaign.find({
        tenantId,
        isDeleted: false,
      });

    const monthly = {};

    campaigns.forEach(
      (campaign) => {
        const date =
          new Date(
            campaign.createdAt
          );

        const month =
          date.toLocaleString(
            "en-US",
            {
              month: "short",
            }
          );

        if (!monthly[month]) {
          monthly[month] = {
            month,
            leads: 0,
            conversions: 0,
          };
        }

        monthly[
          month
        ].leads +=
          campaign.leads || 0;

        monthly[
          month
        ].conversions +=
          campaign.conversions || 0;
      }
    );

    return Object.values(
      monthly
    );
  };