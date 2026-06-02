const express = require("express");

const router = express.Router();

const {
  protect,
  authorize,
} = require("../../../middleware/auth.middleware");

const campaignController = require("./campaign.controller");

router.post(
  "/",
  protect,
  authorize("admin", "manager"),
  campaignController.createCampaign
);

router.get(
  "/",
  protect,
  authorize("admin", "manager", "client"),
  campaignController.getCampaigns
);

module.exports = router;