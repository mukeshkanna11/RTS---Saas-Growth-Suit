// src/modules/crm/deals/deal.routes.js

const express = require("express");
const router = express.Router();

const {
  create,
  getAll,
  getOne,
  updateDeal,
  updateStage,
  assignDeal,
  deleteDeal,
  getTeamDeals,
  getMyDeals,
} = require("./deal.controller");

// 🔐 AUTH
const {
  protect,
  authorize,
} = require("../../../middleware/auth.middleware");

// ======================================================
// 🔐 GLOBAL AUTH
// ======================================================
router.use(protect);

// ======================================================
// 👥 ROLE BASED DEALS
// ======================================================

// 👨‍💼 Manager/Admin → Team Deals
router.get(
  "/team",
  authorize("admin", "manager"),
  getTeamDeals
);

// 👨‍💻 Employee → Own Deals
router.get(
  "/my",
  getMyDeals
);

// ======================================================
// 🟢 CREATE DEAL
// ======================================================
router.post("/", create);

// ======================================================
// 📥 GET ALL DEALS
// ======================================================
router.get("/", getAll);

// ======================================================
// 📄 GET SINGLE DEAL
// ======================================================
router.get("/:id", getOne);

// ======================================================
// ✏️ UPDATE FULL DEAL
// ======================================================
router.put("/:id", updateDeal);

// ======================================================
// 🔄 UPDATE DEAL STAGE
// ======================================================
router.put("/:id/stage", updateStage);

// ======================================================
// 👤 ASSIGN DEAL
// ======================================================
router.patch(
  "/:id/assign",
  authorize("admin", "manager"),
  assignDeal
);

// ======================================================
// ❌ DELETE DEAL
// ======================================================
router.delete("/:id", deleteDeal);

module.exports = router;