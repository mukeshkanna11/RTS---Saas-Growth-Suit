"use strict";

const router = require("express").Router();
const ctrl = require("./revenue.controller");
const { protect, authorize } = require("../../middleware/auth.middleware");

router.use(protect);
router.use(authorize("admin", "superadmin"));

// GET /api/v1/admin/revenue/overview
router.get("/overview", ctrl.getOverview);

// GET /api/v1/admin/revenue/mrr?months=6
router.get("/mrr", ctrl.getMRR);

// GET /api/v1/admin/revenue/plans
router.get("/plans", ctrl.getRevenueByPlan);

// GET /api/v1/admin/revenue/transactions
router.get("/transactions", ctrl.getTransactions);

// GET /api/v1/admin/revenue/ai-cost?months=3
router.get("/ai-cost", ctrl.getAICost);

// GET /api/v1/admin/revenue/churn?months=6
router.get("/churn", ctrl.getChurn);

module.exports = router;
