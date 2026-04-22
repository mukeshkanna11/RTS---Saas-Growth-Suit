const Campaign = require("./campaign.model");

const {
  createCampaignService,
  sendCampaignService,
  getCampaignsService,
  updateCampaignService,
  deleteCampaignService,
} = require("./marketing.service");

// ===============================
// CREATE CAMPAIGN
// ===============================
exports.createCampaign = async (req, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(403).json({
        success: false,
        message: "Tenant access missing",
      });
    }

    const data = await createCampaignService(req.body, req.user);

    return res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// GET ALL CAMPAIGNS
// ===============================
exports.getCampaigns = async (req, res) => {
  try {
    const data = await getCampaignsService(req.user);

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// GET SINGLE CAMPAIGN (FIXED)
// ===============================
exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId,
      isDeleted: { $ne: true },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: campaign,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// UPDATE CAMPAIGN
// ===============================
exports.updateCampaign = async (req, res) => {
  try {
    const data = await updateCampaignService(
      req.params.id,
      req.body,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Campaign updated successfully",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// DELETE CAMPAIGN
// ===============================
exports.deleteCampaign = async (req, res) => {
  try {
    const data = await deleteCampaignService(req.params.id, req.user);

    return res.status(200).json({
      success: true,
      message: "Campaign deleted successfully",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// SEND CAMPAIGN
// ===============================
exports.sendCampaign = async (req, res) => {
  try {
    const data = await sendCampaignService(req.params.id, req.user);

    return res.status(200).json({
      success: true,
      message: "Campaign sent successfully",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};