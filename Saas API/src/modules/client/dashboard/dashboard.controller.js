const dashboardService = require("./dashboard.service");
const analytics = require("./dashboard.analytics");

/* ==========================================================
   DASHBOARD OVERVIEW
========================================================== */

exports.getDashboard = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant ID is required",
      });
    }

    const dashboard =
      await dashboardService.getDashboardData(
        tenantId
      );

    return res.status(200).json({
      success: true,
      message:
        "Dashboard fetched successfully",
      data: dashboard,
    });
  } catch (error) {
    console.error(
      "DASHBOARD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to load dashboard",
    });
  }
};

/* ==========================================================
   GROWTH ANALYTICS
========================================================== */

exports.getGrowthAnalytics =
  async (req, res) => {
    try {
      const tenantId =
        req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message:
            "Tenant ID is required",
        });
      }

      const growth =
        await analytics.getMonthlyGrowth(
          tenantId
        );

      return res.status(200).json({
        success: true,
        message:
          "Growth analytics fetched successfully",
        data: growth,
      });
    } catch (error) {
      console.error(
        "GROWTH ANALYTICS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to load growth analytics",
      });
    }
  };

/* ==========================================================
   FULL ANALYTICS
========================================================== */

exports.getAnalytics = async (
  req,
  res
) => {
  try {
    const tenantId =
      req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message:
          "Tenant ID is required",
      });
    }

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
      analytics.getKpiSummary(
        tenantId
      ),

      analytics.getMonthlyGrowth(
        tenantId
      ),

      analytics.getChannelAnalytics(
        tenantId
      ),

      analytics.getCampaignAnalytics(
        tenantId
      ),

      analytics.getFunnelAnalytics(
        tenantId
      ),

      analytics.getLeadSourceAnalytics(
        tenantId
      ),

      analytics.getRecentLeads(
        tenantId
      ),

      analytics.getUpcomingFollowups(
        tenantId
      ),
    ]);

    return res.status(200).json({
      success: true,

      message:
        "Analytics fetched successfully",

      data: {
        summary,

        growth,

        channels,

        campaigns,

        funnel,

        leadSources,

        recentLeads,

        upcomingFollowups,
      },

      meta: {
        generatedAt:
          new Date().toISOString(),

        tenantId,

        version: "3.0.0",
      },
    });
  } catch (error) {
    console.error(
      "ANALYTICS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to fetch analytics",
    });
  }
};