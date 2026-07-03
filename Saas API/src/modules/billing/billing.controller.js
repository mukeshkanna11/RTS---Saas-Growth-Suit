"use strict";

// ======================================================
// billing.controller.js
// Customer-facing billing dashboard endpoints
// ======================================================

const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess, sendError } = require("../../utils/apiResponse");
const Subscription = require("../subscription/subscription.model");
const PaymentTransaction = require("./models/paymentTransaction.model");
const tokenBilling = require("../../services/tokenBilling.service");
const InvoiceService = require("../../services/invoice.service");
const path = require("path");
const fs = require("fs");

// ══════════════════════════════════════════════════════
// GET BILLING OVERVIEW
// GET /api/v1/billing/overview
// Returns current subscription + token balance summary
// ══════════════════════════════════════════════════════
exports.getOverview = asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;

  const [sub, tokenSummary] = await Promise.all([
    Subscription.findOne({
      companyId: tenantId,
      isDeleted: false,
    })
      .select(
        "plan billingCycle status paymentStatus amount currency renewalDate " +
        "lastPaymentDate isTrialActive trialEndsAt tokenBudget tokensResetAt " +
        "paymentGateway invoice autoRenew startedAt modules"
      )
      .lean(),
    tokenBilling.getUsageSummary(tenantId).catch(() => null),
  ]);

  if (!sub) {
    return sendSuccess(res, { subscription: null, tokens: null }, "No subscription found");
  }

  return sendSuccess(res, {
    subscription: {
      plan: sub.plan,
      billingCycle: sub.billingCycle,
      status: sub.status,
      paymentStatus: sub.paymentStatus,
      amount: sub.amount,
      currency: sub.currency,
      renewalDate: sub.renewalDate,
      lastPaymentDate: sub.lastPaymentDate,
      isTrialActive: sub.isTrialActive,
      trialEndsAt: sub.trialEndsAt,
      autoRenew: sub.autoRenew,
      paymentGateway: sub.paymentGateway,
      startedAt: sub.startedAt,
      modules: sub.modules,
      invoice: sub.invoice || null,
    },
    tokens: tokenSummary,
  }, "Billing overview");
});

// ══════════════════════════════════════════════════════
// LIST INVOICES
// GET /api/v1/billing/invoices
// Returns all invoices for this tenant (from transactions)
// ══════════════════════════════════════════════════════
exports.listInvoices = asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const filter = {
    companyId: tenantId,
    status: "completed",
    type: { $in: ["subscription_payment", "subscription_renewal", "plan_upgrade", "plan_downgrade"] },
  };

  const [transactions, total] = await Promise.all([
    PaymentTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("type plan billingCycle amount currency paypalOrderId paypalCaptureId processedAt createdAt gateway")
      .lean(),
    PaymentTransaction.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    invoices: transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }, "Invoice list");
});

// ══════════════════════════════════════════════════════
// DOWNLOAD INVOICE PDF
// GET /api/v1/billing/invoices/:transactionId/download
// ══════════════════════════════════════════════════════
exports.downloadInvoice = asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { transactionId } = req.params;

  const tx = await PaymentTransaction.findOne({
    _id: transactionId,
    companyId: tenantId,
  });

  if (!tx) return sendError(res, "Transaction not found", 404);

  // Load the parent subscription for client info
  const sub = await Subscription.findById(tx.subscriptionId).select(
    "clientName clientEmail invoice amount currency plan billingCycle"
  );

  if (!sub) return sendError(res, "Subscription not found", 404);

  // If an invoice file already exists on the subscription, serve it
  if (sub.invoice?.url) {
    const filePath = path.join(process.cwd(), sub.invoice.url.replace(/^\//, ""));
    if (fs.existsSync(filePath)) {
      return res.download(filePath, `invoice-${sub.invoice.invoiceId}.pdf`);
    }
  }

  // Generate on-demand
  const { getPlan } = require("../subscription/subscription.plans");
  const planConfig = getPlan(sub.plan);

  const result = await InvoiceService.generateInvoice({
    customer: {
      name: sub.clientName,
      email: sub.clientEmail,
    },
    subscription: {
      plan: sub.plan,
      billingCycle: sub.billingCycle,
    },
    paypalTransaction: tx.paypalCaptureId ? {
      captureId: tx.paypalCaptureId,
      orderId: tx.paypalOrderId,
    } : undefined,
    items: [
      {
        name: `${planConfig?.name || sub.plan} Plan`,
        description: `Billing Cycle: ${sub.billingCycle}`,
        qty: 1,
        price: tx.amount || sub.amount,
      },
    ],
    discount: 0,
    cgst: 9,
    sgst: 9,
    igst: 0,
  });

  if (!result?.invoice?.filePath) {
    return sendError(res, "Invoice generation failed", 500);
  }

  return res.download(result.invoice.filePath, `invoice-${result.invoice.invoiceId}.pdf`);
});

// ══════════════════════════════════════════════════════
// LIST TRANSACTIONS
// GET /api/v1/billing/transactions
// Full transaction history for the tenant
// ══════════════════════════════════════════════════════
exports.listTransactions = asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const { status, type } = req.query;

  const filter = { companyId: tenantId };
  if (status) filter.status = status;
  if (type) filter.type = type;

  const [transactions, total] = await Promise.all([
    PaymentTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-rawPayload")
      .lean(),
    PaymentTransaction.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }, "Transaction list");
});

// ══════════════════════════════════════════════════════
// GET TOKEN USAGE
// GET /api/v1/billing/tokens
// Current AI token balance and usage for this billing period
// ══════════════════════════════════════════════════════
exports.getTokenUsage = asyncHandler(async (req, res) => {
  const summary = await tokenBilling.getUsageSummary(req.user.tenantId);
  return sendSuccess(res, summary, "Token usage");
});
