const ClientAlert = require("./client-alert.model");
const MarketingCampaign = require("../campaigns/marketing-campaign.model");

/* ==========================================================
   CREATE ALERT
========================================================== */

exports.createAlert = async ({
  tenantId,
  title,
  message,
  severity = "low",
  createdBy = null,
}) => {
  const existingAlert = await ClientAlert.findOne({
    tenantId,
    title,
    message,
    isRead: false,
  });

  if (existingAlert) {
    return existingAlert;
  }

  return await ClientAlert.create({
    tenantId,
    title,
    message,
    severity,
    createdBy,
  });
};

/* ==========================================================
   GET ALERTS
========================================================== */

exports.getAlerts = async (
  tenantId,
  {
    page = 1,
    limit = 20,
    severity,
    isRead,
  } = {}
) => {
  const filter = { tenantId };

  if (severity) filter.severity = severity;

  if (typeof isRead !== "undefined") {
    filter.isRead = isRead;
  }

  const alerts = await ClientAlert.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await ClientAlert.countDocuments(
    filter
  );

  return {
    alerts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/* ==========================================================
   GET UNREAD COUNT
========================================================== */

exports.getUnreadCount = async (
  tenantId
) => {
  return await ClientAlert.countDocuments({
    tenantId,
    isRead: false,
  });
};

/* ==========================================================
   MARK READ
========================================================== */

exports.markAsRead = async (
  tenantId,
  alertId
) => {
  return await ClientAlert.findOneAndUpdate(
    {
      _id: alertId,
      tenantId,
    },
    {
      isRead: true,
    },
    {
      new: true,
    }
  );
};

/* ==========================================================
   MARK ALL READ
========================================================== */

exports.markAllRead = async (
  tenantId
) => {
  return await ClientAlert.updateMany(
    {
      tenantId,
      isRead: false,
    },
    {
      isRead: true,
    }
  );
};

/* ==========================================================
   DELETE ALERT
========================================================== */

exports.deleteAlert = async (
  tenantId,
  alertId
) => {
  return await ClientAlert.findOneAndDelete({
    _id: alertId,
    tenantId,
  });
};

/* ==========================================================
   AUTO ALERT ENGINE
========================================================== */

exports.generateSystemAlerts =
  async (tenantId) => {
    const campaigns =
      await MarketingCampaign.find({
        tenantId,
        isDeleted: false,
      });

    for (const campaign of campaigns) {
      /* ==========================
         Budget Alert
      ========================== */

      const budgetPercent =
        campaign.budgetAllocated > 0
          ? (campaign.budgetSpent /
              campaign.budgetAllocated) *
            100
          : 0;

      if (budgetPercent >= 80) {
        await exports.createAlert({
          tenantId,
          title:
            "Budget Threshold Reached",
          message: `${campaign.campaignName} budget is ${Math.round(
            budgetPercent
          )}% utilized`,
          severity: "high",
        });
      }

      /* ==========================
         Low Conversion Alert
      ========================== */

      if (
        campaign.conversionRate > 0 &&
        campaign.conversionRate < 2
      ) {
        await exports.createAlert({
          tenantId,
          title:
            "Low Conversion Rate",
          message: `${campaign.campaignName} conversion rate dropped below 2%`,
          severity: "medium",
        });
      }

      /* ==========================
         Campaign End Alert
      ========================== */

      if (campaign.endDate) {
        const diffDays = Math.ceil(
          (new Date(campaign.endDate) -
            new Date()) /
            (1000 * 60 * 60 * 24)
        );

        if (
          diffDays <= 7 &&
          diffDays >= 0
        ) {
          await exports.createAlert({
            tenantId,
            title:
              "Campaign Ending Soon",
            message: `${campaign.campaignName} ends in ${diffDays} day(s)`,
            severity: "medium",
          });
        }
      }
    }

    return true;
  };

/* ==========================================================
   DASHBOARD ALERTS
========================================================== */

exports.getDashboardAlerts =
  async (tenantId) => {
    return await ClientAlert.find({
      tenantId,
    })
      .sort({
        createdAt: -1,
      })
      .limit(5)
      .lean();
  };