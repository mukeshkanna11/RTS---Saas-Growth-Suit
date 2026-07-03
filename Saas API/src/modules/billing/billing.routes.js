"use strict";

const router = require("express").Router();
const ctrl = require("./billing.controller");
const { protect } = require("../../middleware/auth.middleware");

router.use(protect);

// GET /api/v1/billing/overview
router.get("/overview", ctrl.getOverview);

// GET /api/v1/billing/invoices
router.get("/invoices", ctrl.listInvoices);

// GET /api/v1/billing/invoices/:transactionId/download
router.get("/invoices/:transactionId/download", ctrl.downloadInvoice);

// GET /api/v1/billing/transactions
router.get("/transactions", ctrl.listTransactions);

// GET /api/v1/billing/tokens
router.get("/tokens", ctrl.getTokenUsage);

module.exports = router;
