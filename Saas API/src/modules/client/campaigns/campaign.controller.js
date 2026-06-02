const MarketingCampaign = require("./marketing-campaign.model");

// CREATE
exports.createCampaign = async (req, res) => {
  try {
    const campaign = await MarketingCampaign.create({
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      data: campaign,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await MarketingCampaign.find({
      tenantId: req.user.tenantId,
      isDeleted: false,
    });

    return res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};