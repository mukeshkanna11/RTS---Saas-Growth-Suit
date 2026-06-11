const mongoose = require("mongoose");
const path = require("path");

const Subscription = require("./subscription.model");
const { getPlan } = require("./subscription.plans");
const EmailService = require("../../services/email.service");
const InvoiceService = require("../../services/invoice.service");
const events = require("./subscription.events");

// ======================================================
// HELPERS
// ======================================================
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);


const addRenewal = (billingCycle) => {
  const date = new Date();
  date.setMonth(date.getMonth() + (billingCycle === "yearly" ? 12 : 1));
  return date;
};

const success = (res, message, data = null) =>
  res.json({ success: true, message, data });

const fail = (res, message, code = 500) =>
  res.status(code).json({ success: false, message });


const generateInvoiceId = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}-${random}`;
};


// ======================================================
// CREATE INTENT
// ======================================================
exports.createIntent = async (req, res) => {
  try {
    const {
      companyId,
      clientName,
      clientEmail,
      plan,
      billingCycle = "monthly",
    } = req.body;

    // ======================================================
    // AUTH CHECK (FIXED - use req.user.id)
    // ======================================================
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    // ======================================================
    // VALIDATE INPUTS
    // ======================================================
    if (!companyId || !clientName || !clientEmail || !plan) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // ======================================================
    // GET PLAN
    // ======================================================
    const selectedPlan = getPlan(plan);

    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected",
      });
    }

    // ======================================================
    // CALCULATE AMOUNT
    // ======================================================
    const amount =
      billingCycle === "yearly"
        ? selectedPlan.pricing.yearly
        : selectedPlan.pricing.monthly;

    // ======================================================
    // CREATE SUBSCRIPTION INTENT
    // ======================================================
    const subscription = await Subscription.create({
      companyId,
      userId: req.user.id, // ✅ FIXED (NO _id)
      clientName,
      clientEmail,
      plan: selectedPlan.id,
      billingCycle,
      amount,

      status: "pending",
      paymentStatus: "pending",

      projectsIncluded: selectedPlan.limits.projectsIncluded,
      teamMembers: selectedPlan.limits.teamMembers,
      modules: selectedPlan.modules,
    });

    // ======================================================
    // RESPONSE
    // ======================================================
    return res.status(201).json({
      success: true,
      message: "Subscription intent created successfully",
      data: subscription,
    });

  } catch (err) {
    console.error("CREATE INTENT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
};

// ======================================================
// CONFIRM PAYMENT
// ======================================================
exports.confirmPayment = async (req, res) => {
  try {
    const { subscriptionId, transactionId } = req.body;

    if (!isValidId(subscriptionId))
      return fail(res, "Invalid subscriptionId", 400);

    const sub = await Subscription.findById(subscriptionId);
    if (!sub) return fail(res, "Subscription not found", 404);

    sub.paymentStatus = "paid";
    sub.status = "active";
    sub.transactionId = transactionId;
    sub.renewalDate = addRenewal(sub.billingCycle);
    sub.lastPaymentDate = new Date();

    await sub.save();

    return success(res, "Payment confirmed", sub);
  } catch (err) {
    return fail(res, err.message);
  }
};

// ======================================================
// GET MY SUBSCRIPTION
// ======================================================
exports.getMySubscription = async (req, res) => {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    // ======================================================
    // SAFE QUERY (handles SaaS multi-tenant properly)
    // ======================================================
    const query = {
      isDeleted: false,
      $or: [
        { userId: user.id },
        { clientEmail: user.email },
        ...(user.companyId ? [{ companyId: user.companyId }] : []),
      ],
    };

    const sub = await Subscription.findOne(query).sort({
      createdAt: -1,
    });

    if (!sub) {
      return res.status(404).json({
        success: false,
        message: "No subscription found",
      });
    }

    return res.json({
      success: true,
      message: "Fetched subscription",
      data: sub,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// ======================================================
// GET ALL (ADMIN)
// ======================================================
exports.getAll = async (req, res) => {
  try {
    const data = await Subscription.find({ isDeleted: false })
      .populate("companyId userId")
      .sort({ createdAt: -1 });

    return success(res, "All subscriptions", data);
  } catch (err) {
    return fail(res, err.message);
  }
};

// ======================================================
// CHANGE PLAN
// ======================================================
exports.changePlan = async (req, res) => {
  try {
    const { plan, billingCycle } = req.body;

    const sub = await Subscription.findById(req.params.id);
    if (!sub) return fail(res, "Not found", 404);

    const selected = getPlan(plan);
    if (!selected) return fail(res, "Invalid plan", 400);

    sub.plan = selected.id;
    sub.billingCycle = billingCycle || "monthly";
    sub.amount =
      billingCycle === "yearly"
        ? selected.pricing.yearly
        : selected.pricing.monthly;

    sub.projectsIncluded = selected.limits.projectsIncluded;
    sub.teamMembers = selected.limits.teamMembers;
    sub.modules = selected.modules;

    await sub.save();

    events.emit("plan.changed", sub);

    return success(res, "Plan updated", sub);
  } catch (err) {
    return fail(res, err.message);
  }
};

// ======================================================
// CANCEL
// ======================================================
exports.cancel = async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return fail(res, "Not found", 404);

    sub.status = "cancelled";
    sub.cancelledAt = new Date();

    await sub.save();

    events.emit("subscription.cancelled", sub);

    return success(res, "Cancelled", sub);
  } catch (err) {
    return fail(res, err.message);
  }
};

// ======================================================
// REACTIVATE
// ======================================================
exports.reactivateSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return fail(res, "Not found", 404);

    sub.status = "active";
    sub.reactivatedAt = new Date();

    await sub.save();

    return success(res, "Reactivated", sub);
  } catch (err) {
    return fail(res, err.message);
  }
};

// ======================================================
// INVOICE GENERATION (SAAS ENTERPRISE VERSION)
// ======================================================
// Features:
// ✅ Auto invoice ID
// ✅ PDF generation
// ✅ Optional file storage
// ✅ Optional direct download
// ✅ Multi-tenant ready
// ✅ Safe fallback
// ✅ Stream support
// ======================================================

exports.generateInvoice = async (req, res) => {
  try {
    const subscriptionId = req.params.id;

    // ======================================================
    // 1. FETCH SUBSCRIPTION
    // ======================================================
    const subscription = await Subscription.findById(subscriptionId).populate("userId");

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // ======================================================
    // 2. SECURITY CHECK
    // ======================================================
    const isAdmin = ["admin", "superadmin"].includes(req.user?.role);

    const isOwner =
      subscription.userId?._id?.toString() === req.user?.id?.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized invoice access",
      });
    }

    // ======================================================
    // 3. PAYMENT STATUS LOGIC
    // ======================================================
    const paymentStatus =
      subscription.paymentStatus === "paid"
        ? "PAID"
        : "PENDING";

    // ======================================================
    // 4. MANUAL INVOICE DATA (YOU CONTROL EVERYTHING)
    // ======================================================
    const invoiceData = {
      invoiceId: generateInvoiceId(),

      // ======================================================
      // COMPANY (MANUAL FIXED DETAILS)
      // ======================================================
      company: {
        name: "ReadyTechSolutions Pvt Ltd",
        address: "Coimbatore, Tamil Nadu, India",
        email: "support@readytechsolutions.in",
        phone: "+91-9876543210",
        gstin: "33ABCDE1234F1Z5",
        logo: process.env.COMPANY_LOGO || null,
      },

      // ======================================================
      // CUSTOMER
      // ======================================================
      customer: {
        name: subscription.userId?.name || subscription.clientName || "Unknown",
        email: subscription.userId?.email || subscription.clientEmail || "N/A",
        phone: subscription.userId?.phone || null,
        address: subscription.userId?.address || "India",
        gstin: subscription.userId?.gstin || null,
      },

      // ======================================================
      // ITEMS (MANUAL CONTROLLED)
      // ======================================================
      items: [
        {
          name: `${subscription.plan} Plan Subscription`,
          description: `Billing Cycle: ${subscription.billingCycle}`,
          qty: 1,
          price: Number(subscription.amount || 0),
        },
      ],

      // ======================================================
      // ORDER + PURCHASE DATES
      // ======================================================
      orderDate: subscription.createdAt,
      purchaseDate: new Date(),

      // ======================================================
      // DISCOUNT (MANUAL)
      // ======================================================
      discount: {
        type: req.body.discountType || "percent",
        value: req.body.discountValue || 0,
      },

      // ======================================================
      // GST CONFIG (MANUAL CONTROL)
      // ======================================================
      tax: {
        type: req.body.taxType || "intra", // intra | inter
        cgst: 9,
        sgst: 9,
        igst: 18,
      },

      // ======================================================
      // PAYMENT STATUS
      // ======================================================
      paymentStatus,

      status: paymentStatus,

      createdAt: new Date(),
    };

    // ======================================================
    // 5. GENERATE INVOICE USING SERVICE
    // ======================================================
    const invoice = await InvoiceService.generateInvoice(invoiceData, {
      res,
      autoDownload: false,
      saveToDisk: true,
    });

    // ======================================================
    // 6. SAVE IN SUBSCRIPTION (AUDIT TRAIL)
    // ======================================================
    subscription.invoice = {
      invoiceId: invoiceData.invoiceId,
      generatedAt: new Date(),
      amount: subscription.amount,
      status: paymentStatus,
      gst: invoiceData.tax,
    };

    await subscription.save();

    return res.json({
      success: true,
      message: "Invoice generated successfully",
      data: invoice,
    });
  } catch (err) {
    console.error("Generate invoice error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Invoice generation failed",
    });
  }
};

/**
 * ======================================================
 * DOWNLOAD INVOICE
 * ENTERPRISE SAAS VERSION
 * ======================================================
 * Features:
 * ✅ Dynamic PDF generation
 * ✅ Subscription invoice
 * ✅ Auto download
 * ✅ Multi-tenant ready
 * ✅ Production safe
 * ======================================================
 */

exports.downloadInvoice = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate("userId")
      .lean();

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // ======================================================
    // SECURITY CHECK
    // ======================================================
    const isAdmin = ["admin", "superadmin"].includes(req.user?.role);

    const isOwner =
      subscription.userId?._id?.toString() === req.user?.id?.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized invoice access",
      });
    }

    // ======================================================
    // PAYMENT STATUS
    // ======================================================
    const paymentStatus =
      subscription.paymentStatus === "paid"
        ? "PAID"
        : "PENDING";

    // ======================================================
    // INVOICE DATA (MANUAL STRUCTURE)
    // ======================================================
    const invoiceData = {
      invoiceId:
        subscription.invoice?.invoiceId ||
        generateInvoiceId(),

      company: {
        name: "ReadyTechSolutions Pvt Ltd",
        address: "Coimbatore, Tamil Nadu, India",
        gstin: "33ABCDE1234F1Z5",
      },

      customer: {
        name: subscription.userId?.name || "Customer",
        email: subscription.userId?.email || "N/A",
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
      purchaseDate: subscription.updatedAt || new Date(),

      discount: {
        type: "percent",
        value: 0,
      },

      tax: {
        type: "intra",
        cgst: 9,
        sgst: 9,
        igst: 0,
      },

      paymentStatus,
    };

    // ======================================================
    // STREAM PDF / HTML DOWNLOAD
    // ======================================================
    return await InvoiceService.generateInvoice(invoiceData, {
      res,
      autoDownload: true,
      saveToDisk: false,
    });
  } catch (err) {
    console.error("Invoice download error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Invoice download failed",
    });
  }
};

/**
 * ======================================================
 * AUDIT LOGS (SaaS TRACKING SYSTEM)
 * ======================================================
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // ======================================================
    // SIMPLE AUDIT MODEL (you can extend later with logs collection)
    // ======================================================
    const audit = {
      subscriptionId: subscription._id,
      status: subscription.status,
      paymentStatus: subscription.paymentStatus,
      plan: subscription.plan,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
      renewalDate: subscription.renewalDate,
      lastPaymentDate: subscription.lastPaymentDate,
      cancelledAt: subscription.cancelledAt,
      reactivatedAt: subscription.reactivatedAt,
    };

    return res.json({
      success: true,
      data: audit,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


/**
 * ======================================================
 * PAYMENT WEBHOOK (Stripe / Razorpay READY)
 * ======================================================
 */
exports.paymentWebhook = async (req, res) => {
  try {
    const event = req.body;

    // 🔥 Example structure (adapt for Stripe/Razorpay)
    const subscriptionId = event?.data?.subscriptionId;
    const transactionId = event?.data?.transactionId;
    const status = event?.data?.status;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: "Missing subscriptionId",
      });
    }

    const sub = await Subscription.findById(subscriptionId);
    if (!sub) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // ======================================================
    // UPDATE PAYMENT STATUS
    // ======================================================
    if (status === "success" || status === "paid") {
      sub.paymentStatus = "paid";
      sub.status = "active";
      sub.transactionId = transactionId;

      const renewal = new Date();
      renewal.setMonth(
        renewal.getMonth() +
        (sub.billingCycle === "yearly" ? 12 : 1)
      );

      sub.renewalDate = renewal;
      sub.lastPaymentDate = new Date();
    } else {
      sub.paymentStatus = "failed";
    }

    await sub.save();

    return res.json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.analytics = async (req, res) => { try { const [total, active, cancelled, revenue] = await Promise.all([Subscription.countDocuments({ isDeleted: false }), Subscription.countDocuments({ status: "active" }), Subscription.countDocuments({ status: "cancelled" }), Subscription.aggregate([{ $group: { _id: null, totalRevenue: { $sum: "$amount" }, }, },]),]); return success(res, "Analytics fetched", { totalSubscriptions: total, activeSubscriptions: active, cancelledSubscriptions: cancelled, totalRevenue: revenue?.[0]?.totalRevenue || 0, }); } catch (err) { return error(res, err.message); } };


// ======================================================
// UPGRADE REQUEST
// ENTERPRISE SAAS VERSION
// AUTO EMAIL TRIGGER
// ======================================================

exports.upgradeRequest = async (req, res) => {
  try {

    const {
      name,
      email,
      phone,
      company,
      address,
      notes,
      plan,
      billingCycle,
    } = req.body;

    // SEND ADMIN MAIL
    const admin =
      await EmailService.sendSubscriptionLead({
        name,
        email,
        phone,
        company,
        address,
        notes,
        plan,
        billingCycle,
      });

    // SEND CUSTOMER MAIL
    const customer =
      await EmailService.sendCustomerConfirmation({
        email,
        name,
        plan,
      });

    // IMPORTANT
    return res.status(200).json({
      success: true,
      message:
        "Upgrade request submitted successfully",

      emailStatus: {
        admin,
        customer,
      },
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.analytics = async (req, res) => {
  try {
    const [total, active, cancelled, revenue] = await Promise.all([
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

    return res.json({
      success: true,
      message: "Analytics fetched",
      data: {
        totalSubscriptions: total,
        activeSubscriptions: active,
        cancelledSubscriptions: cancelled,
        totalRevenue: revenue?.[0]?.totalRevenue || 0,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};