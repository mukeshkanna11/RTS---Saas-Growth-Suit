const mongoose = require("mongoose");
const Subscription = require("./subscription.model");
const { getPlan } = require("./subscription.plans");

// ======================================================
// HELPERS (ENTERPRISE SAFE)
// ======================================================
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

class ServiceError extends Error {
  constructor(message, code = 400) {
    super(message);
    this.code = code;
  }
}

const throwError = (msg, code = 400) => {
  throw new ServiceError(msg, code);
};

const safe = (v) => (isNaN(Number(v)) ? 0 : Number(v));

invoiceData.discount = invoiceData.discount || { type: "percent", value: 0 };
invoiceData.tax = invoiceData.tax || {
  type: "intra",
  cgst: 9,
  sgst: 9,
  igst: 0,
};

const items = invoiceData.items || [];

const subtotal = items.reduce((sum, item) => {
  return sum + safe(item.qty) * safe(item.price);
}, 0);

// DISCOUNT
let discountAmount = 0;

if (invoiceData.discount.type === "percent") {
  discountAmount = (subtotal * safe(invoiceData.discount.value)) / 100;
} else {
  discountAmount = safe(invoiceData.discount.value);
}

const taxable = subtotal - discountAmount;

// TAX
const cgst = (taxable * safe(invoiceData.tax.cgst)) / 100;
const sgst = (taxable * safe(invoiceData.tax.sgst)) / 100;
const igst = (taxable * safe(invoiceData.tax.igst)) / 100;

const total = taxable + cgst + sgst + igst;

const generateInvoice = async ({ subscriptionId, tax = {}, discount = {} }) => {
  if (!isValidId(subscriptionId)) {
    throwError("Invalid subscription ID");
  }

  const subscription = await Subscription.findById(subscriptionId).populate("userId");

  if (!subscription) {
    throwError("Subscription not found", 404);
  }

  // ======================================================
  // PAYMENT STATUS LOGIC
  // ======================================================
  const paymentStatus =
    subscription.paymentStatus === "paid" ? "PAID" : "PENDING";

  // ======================================================
  // INVOICE DATA (SAAS MANUAL CONTROLLED)
  // ======================================================
  const invoiceData = {
    invoiceId: "INV-" + Date.now(),

    company: {
      name: "ReadyTechSolutions Pvt Ltd",
      address: "Coimbatore, Tamil Nadu, India",
      gstin: "33ABCDE1234F1Z5",
    },

    customer: {
      name: subscription.userId?.name || subscription.clientName,
      email: subscription.userId?.email || subscription.clientEmail,
      address: "India",
    },

    items: [
      {
        name: `${subscription.plan} Plan Subscription`,
        qty: 1,
        price: Number(subscription.amount || 0),
      },
    ],

    orderDate: subscription.createdAt,
    purchaseDate: new Date(),

    discount: discount || { type: "percent", value: 0 },

    tax: tax || {
      type: "intra",
      cgst: 9,
      sgst: 9,
      igst: 0,
    },

    paymentStatus,
  };

  // ======================================================
  // GENERATE INVOICE PDF + TOTALS
  // ======================================================
  const invoice = await InvoiceService.generateInvoice(invoiceData, {
    saveToDisk: true,
  });

  // ======================================================
  // SAVE TO SUBSCRIPTION (IMPORTANT FOR DOWNLOAD)
  // ======================================================
  subscription.invoice = {
    invoiceId: invoice.invoice.invoiceId,
    fileName: invoice.invoice.fileName,
    filePath: invoice.invoice.filePath,
    generatedAt: new Date(),
  };

  await subscription.save();

  return invoice;
};

const downloadInvoice = async ({ subscriptionId, res }) => {
  if (!isValidId(subscriptionId)) {
    throwError("Invalid subscription ID");
  }

  const subscription = await Subscription.findById(subscriptionId);

  if (!subscription) {
    throwError("Subscription not found", 404);
  }

  if (!subscription.invoice?.filePath) {
    throwError("Invoice not generated yet", 404);
  }

  // ======================================================
  // STREAM PDF FILE
  // ======================================================
  const fs = require("fs");

  if (!fs.existsSync(subscription.invoice.filePath)) {
    throwError("Invoice file missing on server", 404);
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${subscription.invoice.fileName}`
  );

  const fileStream = fs.createReadStream(subscription.invoice.filePath);
  fileStream.pipe(res);
};

// ======================================================
// CREATE SUBSCRIPTION INTENT
// ======================================================
const createSubscriptionIntent = async ({
  companyId,
  clientName,
  clientEmail,
  plan,
  billingCycle = "monthly",
  userId,
  meta = {},
}) => {
  if (!isValidId(companyId)) {
    throwError("Invalid company ID");
  }

  const selectedPlan = getPlan(plan);
  if (!selectedPlan) {
    throwError("Invalid subscription plan");
  }

  const amount =
    billingCycle === "yearly"
      ? selectedPlan.pricing.yearly
      : selectedPlan.pricing.monthly;

  const subscription = await Subscription.create({
    companyId,
    userId,
    clientName,
    clientEmail,
    plan: selectedPlan.id,
    billingCycle,
    amount,

    status: "pending",
    paymentStatus: "pending",

    projectsIncluded: selectedPlan.limits.projectsIncluded,
    teamMembers: selectedPlan.limits.teamMembers,
    storageGB: selectedPlan.limits.storageGB,
    apiRequestsPerMonth: selectedPlan.limits.apiRequestsPerMonth,

    modules: selectedPlan.modules,

    meta: {
      source: meta.source || "api",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  });

  return subscription;
};

// ======================================================
// CONFIRM PAYMENT (INVOICE READY)
// ======================================================
const confirmPayment = async ({
  subscriptionId,
  transactionId,
  paymentGateway = "manual",
}) => {
  if (!isValidId(subscriptionId)) {
    throwError("Invalid subscription ID");
  }

  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    throwError("Subscription not found", 404);
  }

  const invoiceId = "INV-" + Date.now();

  subscription.paymentStatus = "paid";
  subscription.status = "active";
  subscription.transactionId = transactionId;
  subscription.paymentGateway = paymentGateway;

  subscription.invoice = {
    invoiceId,
    generatedAt: new Date(),
  };

  subscription.lastPaymentDate = new Date();

  const renewal = new Date();
  renewal.setMonth(
    renewal.getMonth() +
      (subscription.billingCycle === "yearly" ? 12 : 1)
  );

  subscription.renewalDate = renewal;

  await subscription.save();

  return subscription;
};

// ======================================================
// GET CURRENT USER SUBSCRIPTION (MULTI-TENANT SAFE)
// ======================================================
const getMySubscription = async ({ companyId, email }) => {
  let query = null;

  if (companyId && isValidId(companyId)) {
    query = { companyId };
  } else if (email) {
    query = { clientEmail: email };
  }

  if (!query) {
    throwError("Missing subscription lookup info");
  }

  const subscription = await Subscription.findOne(query)
    .sort({ createdAt: -1 })
    .lean();

  if (!subscription) {
    throwError("Subscription not found", 404);
  }

  return subscription;
};

// ======================================================
// GET ALL SUBSCRIPTIONS (ADMIN ONLY)
// ======================================================
const getAllSubscriptions = async () => {
  return Subscription.find({ isDeleted: false })
    .populate("companyId userId")
    .sort({ createdAt: -1 })
    .lean();
};

// ======================================================
// CHANGE PLAN (SAFE UPGRADE)
// ======================================================
const changePlan = async ({
  subscriptionId,
  plan,
  billingCycle = "monthly",
}) => {
  if (!isValidId(subscriptionId)) {
    throwError("Invalid subscription ID");
  }

  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    throwError("Subscription not found", 404);
  }

  const selectedPlan = getPlan(plan);
  if (!selectedPlan) {
    throwError("Invalid plan");
  }

  const amount =
    billingCycle === "yearly"
      ? selectedPlan.pricing.yearly
      : selectedPlan.pricing.monthly;

  subscription.plan = selectedPlan.id;
  subscription.billingCycle = billingCycle;
  subscription.amount = amount;

  subscription.projectsIncluded = selectedPlan.limits.projectsIncluded;
  subscription.teamMembers = selectedPlan.limits.teamMembers;
  subscription.storageGB = selectedPlan.limits.storageGB;
  subscription.apiRequestsPerMonth =
    selectedPlan.limits.apiRequestsPerMonth;

  subscription.modules = selectedPlan.modules;

  await subscription.save();

  return subscription;
};

// ======================================================
// CANCEL SUBSCRIPTION (SOFT DELETE READY)
// ======================================================
const cancelSubscription = async (subscriptionId) => {
  if (!isValidId(subscriptionId)) {
    throwError("Invalid subscription ID");
  }

  const subscription = await Subscription.findByIdAndUpdate(
    subscriptionId,
    {
      status: "cancelled",
      cancelledAt: new Date(),
    },
    { new: true }
  );

  if (!subscription) {
    throwError("Subscription not found", 404);
  }

  return subscription;
};

// ======================================================
// REACTIVATE SUBSCRIPTION
// ======================================================
const reactivateSubscription = async (subscriptionId) => {
  if (!isValidId(subscriptionId)) {
    throwError("Invalid subscription ID");
  }

  const subscription = await Subscription.findByIdAndUpdate(
    subscriptionId,
    {
      status: "active",
      reactivatedAt: new Date(),
    },
    { new: true }
  );

  if (!subscription) {
    throwError("Subscription not found", 404);
  }

  return subscription;
};

// ======================================================
// ANALYTICS (HIGH PERFORMANCE)
// ======================================================
const getAnalytics = async () => {
  const [
    totalSubscriptions,
    activeSubscriptions,
    cancelledSubscriptions,
    revenue,
  ] = await Promise.all([
    Subscription.countDocuments({ isDeleted: false }),
    Subscription.countDocuments({ status: "active" }),
    Subscription.countDocuments({ status: "cancelled" }),
    Subscription.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  return {
    totalSubscriptions,
    activeSubscriptions,
    cancelledSubscriptions,
    totalRevenue: revenue?.[0]?.totalRevenue || 0,
  };
};

// ======================================================
// EXPORTS
// ======================================================
module.exports = {
  createSubscriptionIntent,
  confirmPayment,
  getMySubscription,
  getAllSubscriptions,
  changePlan,
  cancelSubscription,
  reactivateSubscription,
  getAnalytics,
   generateInvoice,
  downloadInvoice,
  ServiceError,
};