const express = require("express");

const {
  createCampaign,
  getCampaigns,
  getCampaignById,   // ✅ FIXED (important)
  sendCampaign,
  updateCampaign,
  deleteCampaign,
} = require("./marketing.controller");

const { protect } = require("../../middleware/auth.middleware");

const router = express.Router();

/* =========================
   CAMPAIGN ROUTES (SAAS)
========================= */

// CREATE
router.post("/campaign", protect, createCampaign);

// LIST
router.get("/campaign", protect, getCampaigns);

// GET SINGLE
router.get("/campaign/:id", protect, getCampaignById);

// UPDATE
router.put("/campaign/:id", protect, updateCampaign);

// DELETE
router.delete("/campaign/:id", protect, deleteCampaign);

// SEND CAMPAIGN
router.post("/campaign/:id/send", protect, sendCampaign);

module.exports = router;