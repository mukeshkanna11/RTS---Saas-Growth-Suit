const Campaign = require("./campaign.model");
const Lead = require("../leads/lead.model");
const MarketingActivity = require("./activity.model");
const { sendEmail } = require("./email.service");
const { sendWhatsApp } = require("./whatsapp.service");

// ===============================
// GET CAMPAIGNS (SAAS SAFE)
// ===============================
exports.getCampaignsService = async (user) => {
  if (!user?.tenantId) throw new Error("tenantId missing");

  return await Campaign.find({
    tenantId: user.tenantId,
    isDeleted: { $ne: true },
  }).sort({ createdAt: -1 });
};

// ===============================
// CREATE CAMPAIGN
// ===============================
exports.createCampaignService = async (data, user) => {
  if (!user?.tenantId) throw new Error("tenantId missing");

  return await Campaign.create({
    name: data.name,
    type: data.type || "email",
    subject: data.subject || "",
    content: data.content,

    tenantId: user.tenantId,
    createdBy: user._id,

    status: "draft",
    stats: { sent: 0, success: 0, failed: 0 },
  });
};

// ===============================
// UPDATE CAMPAIGN (NEW)
// ===============================
exports.updateCampaignService = async (id, data, user) => {
  if (!user?.tenantId) throw new Error("tenantId missing");

  const campaign = await Campaign.findOneAndUpdate(
    { _id: id, tenantId: user.tenantId, isDeleted: { $ne: true } },
    { $set: data },
    { new: true }
  );

  if (!campaign) throw new Error("Campaign not found");

  return campaign;
};

// ===============================
// SOFT DELETE (NEW)
// ===============================
exports.deleteCampaignService = async (id, user) => {
  if (!user?.tenantId) throw new Error("tenantId missing");

  const campaign = await Campaign.findOneAndUpdate(
    { _id: id, tenantId: user.tenantId },
    { isDeleted: true },
    { new: true }
  );

  if (!campaign) throw new Error("Campaign not found");

  return campaign;
};

// ===============================
// SEND CAMPAIGN
// ===============================
exports.sendCampaignService = async (campaignId, user) => {
  if (!user?.tenantId) throw new Error("tenantId missing");

  const campaign = await Campaign.findOne({
    _id: campaignId,
    tenantId: user.tenantId,
    isDeleted: { $ne: true },
  });

  if (!campaign) throw new Error("Campaign not found");

  const leads = await Lead.find({
    tenantId: user.tenantId,
    isDeleted: { $ne: true },
  });

  let success = 0;
  let failed = 0;

  for (const lead of leads) {
    try {
      // EMAIL
      if (campaign.type === "email" && lead.email) {
        await sendEmail({
          to: lead.email,
          subject: campaign.subject || campaign.name,
          html: `<h2>${campaign.name}</h2><p>${campaign.content}</p>`,
        });

        success++;

        await MarketingActivity.create({
          type: "email_sent",
          leadId: lead._id,
          campaignId: campaign._id,
          tenantId: user.tenantId,
          status: "success",
        });
      }

      // WHATSAPP
      if (campaign.type === "whatsapp" && lead.phone) {
        await sendWhatsApp({
          to: lead.phone,
          message: `${campaign.name}: ${campaign.content}`,
        });

        success++;

        await MarketingActivity.create({
          type: "whatsapp_sent",
          leadId: lead._id,
          campaignId: campaign._id,
          tenantId: user.tenantId,
          status: "success",
        });
      }
    } catch (err) {
      failed++;

      await MarketingActivity.create({
        type: `${campaign.type}_sent`,
        leadId: lead._id,
        campaignId: campaign._id,
        tenantId: user.tenantId,
        status: "failed",
        error: err.message,
      });
    }
  }

  campaign.status = "completed";
  campaign.stats = {
    sent: leads.length,
    success,
    failed,
  };

  await campaign.save();

  return campaign;
};