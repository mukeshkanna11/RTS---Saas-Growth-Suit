const MarketingCampaign = require(
  "../campaigns/marketing-campaign.model"
);

const Lead = require(
  "../../leads/lead.model"
);

/* ==========================================================
   KPI SUMMARY
========================================================== */

exports.getKpiSummary = async (
  tenantId
) => {
  const campaigns =
    await MarketingCampaign.find({
      tenantId,
      isDeleted: false,
    }).lean();

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
    totals.leads > 0
      ? Number(
          (
            (totals.conversions /
              totals.leads) *
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

  const budgetUtilization =
    totals.budgetAllocated > 0
      ? Number(
          (
            (totals.budgetSpent /
              totals.budgetAllocated) *
            100
          ).toFixed(2)
        )
      : 0;

  return {
    ...totals,
    ctr,
    conversionRate,
    cpl,
    budgetUtilization,
  };
};

/* ==========================================================
   MONTHLY GROWTH CHART
========================================================== */

exports.getMonthlyGrowth =
  async (tenantId) => {
    const campaigns =
      await MarketingCampaign.find({
        tenantId,
        isDeleted: false,
      }).lean();

    const growthMap = {};

    campaigns.forEach(
      (campaign) => {
        const month =
          new Date(
            campaign.createdAt
          ).toLocaleString(
            "en-US",
            {
              month: "short",
            }
          );

        if (
          !growthMap[month]
        ) {
          growthMap[
            month
          ] = {
            month,
            impressions: 0,
            clicks: 0,
            leads: 0,
            conversions: 0,
          };
        }

        growthMap[
          month
        ].impressions +=
          campaign.impressions || 0;

        growthMap[
          month
        ].clicks +=
          campaign.clicks || 0;

        growthMap[
          month
        ].leads +=
          campaign.leads || 0;

        growthMap[
          month
        ].conversions +=
          campaign.conversions || 0;
      }
    );

    return Object.values(
      growthMap
    );
  };

/* ==========================================================
   CHANNEL PERFORMANCE
========================================================== */

exports.getChannelAnalytics =
  async (tenantId) => {
    return await MarketingCampaign.aggregate(
      [
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
              $sum:
                "$clicks",
            },

            leads: {
              $sum: "$leads",
            },

            conversions: {
              $sum:
                "$conversions",
            },

            budgetSpent: {
              $sum:
                "$budgetSpent",
            },
          },
        },
        {
          $project: {
            _id: 0,
            channel: "$_id",
            impressions: 1,
            clicks: 1,
            leads: 1,
            conversions: 1,
            budgetSpent: 1,
          },
        },
      ]
    );
  };

/* ==========================================================
   TOP CAMPAIGNS
========================================================== */

exports.getCampaignAnalytics =
  async (tenantId) => {
    const campaigns =
      await MarketingCampaign.find({
        tenantId,
        isDeleted: false,
      })
        .sort({
          conversions: -1,
        })
        .limit(10)
        .lean();

    return campaigns;
  };

/* ==========================================================
   CONVERSION FUNNEL
========================================================== */

exports.getFunnelAnalytics =
  async (tenantId) => {
    const summary =
      await exports.getKpiSummary(
        tenantId
      );

    return {
      aware:
        summary.impressions,
      engaged:
        summary.clicks,
      lead: summary.leads,
      converted:
        summary.conversions,
    };
  };

/* ==========================================================
   LEAD SOURCE ANALYTICS
========================================================== */

exports.getLeadSourceAnalytics =
  async (tenantId) => {
    return await Lead.aggregate([
      {
        $match: {
          tenantId,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$source",
          total: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          source: "$_id",
          total: 1,
        },
      },
      {
        $sort: {
          total: -1,
        },
      },
    ]);
  };

/* ==========================================================
   RECENT LEADS
========================================================== */

exports.getRecentLeads =
  async (tenantId) => {
    return await Lead.find({
      tenantId,
      isDeleted: false,
    })
      .select(
        "name email phone source status createdAt"
      )
      .sort({
        createdAt: -1,
      })
      .limit(5)
      .lean();
  };

/* ==========================================================
   UPCOMING FOLLOWUPS
========================================================== */

exports.getUpcomingFollowups =
  async (tenantId) => {
    return await Lead.find({
      tenantId,
      isDeleted: false,

      followUpDate: {
        $gte: new Date(),
      },
    })
      .select(
        "name phone followUpDate status"
      )
      .sort({
        followUpDate: 1,
      })
      .limit(10)
      .lean();
  };

/* ==========================================================
   DASHBOARD OVERVIEW
========================================================== */

exports.getDashboardOverview =
  async (tenantId) => {
    const [
      summary,
      growth,
      channels,
      campaigns,
      funnel,
      leadSources,
      recentLeads,
      upcomingFollowups,
    ] = await Promise.all([
      exports.getKpiSummary(
        tenantId
      ),

      exports.getMonthlyGrowth(
        tenantId
      ),

      exports.getChannelAnalytics(
        tenantId
      ),

      exports.getCampaignAnalytics(
        tenantId
      ),

      exports.getFunnelAnalytics(
        tenantId
      ),

      exports.getLeadSourceAnalytics(
        tenantId
      ),

      exports.getRecentLeads(
        tenantId
      ),

      exports.getUpcomingFollowups(
        tenantId
      ),
    ]);

    return {
      summary,
      growth,
      channels,
      campaigns,
      funnel,
      leadSources,
      recentLeads,
      upcomingFollowups,
      generatedAt:
        new Date(),
    };
  };