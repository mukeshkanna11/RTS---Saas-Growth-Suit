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

exports.generateInvoice = async function generateInvoice(
  data,
  options = {}
) {
  try {
    // ==================================================
    // OPTIONS
    // ==================================================

    const {
      filePath = null,
      res = null,
      autoDownload = false,
      saveToDisk = true,
    } = options;

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!data) {
      throw new Error("Invoice data is required");
    }

    if (!data.customer) {
      throw new Error("Customer details missing");
    }

    if (
      !Array.isArray(data.items) ||
      !data.items.length
    ) {
      throw new Error("Invoice items missing");
    }

    // ==================================================
    // CREATE PDF
    // ==================================================

    const result = await this.createPDF(
      data,
      saveToDisk ? filePath : null
    );

    // ==================================================
    // DIRECT DOWNLOAD MODE
    // ==================================================

    if (res && autoDownload) {
      return this.streamInvoice(
        result.filePath,
        res,
        result.fileName
      );
    }

    // ==================================================
    // RETURN RESPONSE
    // ==================================================

    return {
      success: true,
      message:
        "Invoice generated successfully",

      invoice: {
        invoiceId:
          result.invoiceId,

        fileName:
          result.fileName,

        filePath:
          result.filePath,

        totals:
          result.totals,
      },
    };
  } catch (err) {
    console.error(
      "Generate invoice failed:",
      err
    );

    throw new Error(
      err.message ||
        "Invoice generation failed"
    );
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
    // ==================================================
    // GET SUBSCRIPTION
    // ==================================================

    const subscription =
      await Subscription.findById(
        req.params.id
      )
        .populate("userId")
        .lean();

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message:
          "Subscription not found",
      });
    }

    // ==================================================
    // SECURITY CHECK
    // ==================================================

    const isAdmin = [
      "admin",
      "superadmin",
    ].includes(req.user?.role);

    const isOwner =
      subscription.userId?._id?.toString() ===
      req.user?.id?.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized invoice access",
      });
    }

    // ==================================================
    // INVOICE DATA
    // ==================================================

    const invoiceData = {
      invoiceId:
        subscription.invoice?.invoiceId ||
        `INV-${subscription._id}`,

      company: {
        name:
          process.env.COMPANY_NAME ||
          "ReadyTech Solutions",

        address:
          process.env.COMPANY_ADDRESS ||
          "Tamil Nadu, India",

        gstin:
          process.env.COMPANY_GST ||
          "33ABCDE1234F1Z5",
      },

      customer: {
        name:
          subscription.userId?.name ||
          subscription.clientName ||
          "Customer",

        email:
          subscription.userId?.email ||
          subscription.clientEmail ||
          "N/A",

        address: "India",
      },

      items: [
        {
          name: `${subscription.plan} Plan`,
          qty: 1,
          price:
            Number(
              subscription.amount || 0
            ),
        },
      ],

      discount: 0,

      cgst: 9,

      sgst: 9,

      paymentStatus:
        subscription.paymentStatus ||
        "paid",
    };

    // ==================================================
    // DIRECT PDF STREAM
    // ==================================================

    return await InvoiceService.generateInvoice(
      invoiceData,
      {
        res,
        autoDownload: true,
        saveToDisk: false,
      }
    );
  } catch (err) {
    console.error(
      "Invoice download error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Invoice download failed",
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
    console.log("🔥 UPGRADE REQUEST RECEIVED");
    console.log(req.body);

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

    // ================= VALIDATION =================

    if (!name || !email || !plan || !billingCycle) {
      return res.status(400).json({
        success: false,
        message:
          "name, email, plan and billingCycle are required",
      });
    }

    // ================= ADMIN EMAIL =================

    let adminEmailResult = null;

    adminEmailResult =
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

    console.log(
      "📩 ADMIN EMAIL RESULT:",
      adminEmailResult
    );

    // ================= CUSTOMER EMAIL =================

    let customerEmailResult = null;

    customerEmailResult =
      await EmailService.sendCustomerConfirmation({
        email,
        name,
        plan,
      });

    console.log(
      "📩 CUSTOMER EMAIL RESULT:",
      customerEmailResult
    );

    // ================= RESPONSE =================

    return res.status(200).json({
      success: true,
      message:
        "Upgrade request submitted successfully",

      emailStatus: {
        admin: adminEmailResult,
        customer: customerEmailResult,
      },
    });

  } catch (err) {

    console.error(
      "❌ UPGRADE REQUEST ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Internal server error",
    });
  }
};