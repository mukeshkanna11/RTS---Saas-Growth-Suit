const mongoose = require("mongoose");
const path = require("path");

const Subscription = require("./subscription.model");
const { getPlan, getInrPrice } = require("./subscription.plans");
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

    // companyId must be a valid MongoDB ObjectId — a null or garbage value
    // would cause the partial unique index to accept unlimited inserts since
    // the index only covers non-null companyId documents.
    if (!isValidId(companyId)) {
      return res.status(400).json({
        success: false,
        message: "companyId must be a valid MongoDB ObjectId",
        errorCode: "INVALID_COMPANY_ID",
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
    // CREATE NEW PENDING SUBSCRIPTION
    // Always create a fresh document per checkout session.
    // Reusing an existing pending subscription via upsert caused
    // cross-user data leakage: an old pending record belonging to a
    // different billing contact (e.g. "Siva Admin") would be overwritten
    // with the new contact's name/email at the DB level, but the invoice
    // system would still show stale data from the populated userId field.
    //
    // Design: multiple pending subscriptions per companyId are intentional.
    // They represent separate checkout attempts (possibly for different billing
    // contacts). When any one of them is paid, captureOrder / confirmPayment
    // cancels ALL others for the same company automatically.
    // The partial unique index enforces ONE ACTIVE subscription per company.
    // ======================================================
    const subscription = await Subscription.create({
      companyId,
      userId:           req.user.id,
      clientName,
      clientEmail,
      plan:             selectedPlan.id,
      billingCycle,
      amount,
      status:           "pending",
      paymentStatus:    "pending",
      projectsIncluded: selectedPlan.limits.projectsIncluded,
      teamMembers:      selectedPlan.limits.teamMembers,
      modules:          selectedPlan.modules,
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

    const now = new Date();

    // Cancel competing active/pending subs BEFORE activating to avoid E11000
    await Subscription.updateMany(
      { companyId: sub.companyId, status: { $in: ["pending", "active"] }, _id: { $ne: sub._id } },
      { $set: { status: "cancelled", cancelledAt: now, autoRenew: false } }
    );

    sub.paymentStatus = "paid";
    sub.status = "active";
    sub.transactionId = transactionId;
    sub.renewalDate = addRenewal(sub.billingCycle);
    sub.lastPaymentDate = now;

    try {
      await sub.save();
    } catch (saveErr) {
      if (saveErr.code === 11000) {
        return fail(res, "A concurrent payment already activated a subscription for this company. Refresh and try again.", 409);
      }
      throw saveErr;
    }

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

    // Fetch recent subscriptions and prefer the active one.
    // Sorting by createdAt desc alone would return a stale pending checkout doc
    // instead of the existing active subscription after createIntent is called.
    const subs = await Subscription.find(query).sort({ createdAt: -1 }).limit(10);

    if (!subs.length) {
      return res.status(404).json({
        success: false,
        message: "No subscription found",
      });
    }

    // Priority: active first, then most-recently-created as fallback
    const sub = subs.find((s) => s.status === "active") ?? subs[0];

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
    if (!sub) return fail(res, "Subscription not found", 404);

    // Guard: only terminal statuses can be reactivated.
    // A "pending" subscription hasn't paid yet — it should go through
    // the normal payment flow, not the reactivation path.
    if (sub.status === "active") {
      return fail(res, "Subscription is already active", 409);
    }
    if (sub.status === "pending") {
      return fail(res, "Subscription is pending payment — complete the payment flow instead", 409);
    }

    const now = new Date();

    // Step 1 — cancel any currently active subscription for the same company.
    // This moves competing docs OUT of the partial-unique-index scope BEFORE
    // we try to insert this one INTO it. Without this step, saving sub.status="active"
    // would collide with any pre-existing active document and produce E11000.
    // updateMany is safe here: we only transition active→cancelled (never create docs).
    await Subscription.updateMany(
      {
        companyId: sub.companyId,
        status:    "active",
        _id:       { $ne: sub._id },
      },
      {
        $set: { status: "cancelled", cancelledAt: now, autoRenew: false },
      }
    );

    // Step 2 — activate this subscription.
    sub.status        = "active";
    sub.reactivatedAt = now;
    await sub.save();

    events.emit("subscription.reactivated", {
      subscriptionId: sub._id,
      plan:           sub.plan,
      clientEmail:    sub.clientEmail,
      clientName:     sub.clientName,
      reactivatedAt:  now,
    });

    return success(res, "Subscription reactivated successfully", sub);
  } catch (err) {
    // If the partial unique index fires despite Step 1 (e.g. race condition),
    // return a clear message instead of an unhandled 500.
    if (err.code === 11000) {
      return fail(
        res,
        "Another active subscription exists for this company. Refresh and try again.",
        409
      );
    }
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

      // Company details read from env — invoice.service.js falls back to
      // these same env vars if omitted, but passing them explicitly ensures
      // the values are consistent regardless of service-layer defaults.
      company: {
        name:    process.env.COMPANY_NAME    || "ReadyTechSolutions Pvt Ltd",
        address: process.env.COMPANY_ADDRESS || "Coimbatore, Tamil Nadu, India",
        email:   process.env.COMPANY_MAIL    || "support@readytechsolutions.in",
        phone:   process.env.COMPANY_PHONE   || "+91-9876543210",
        gstin:   process.env.COMPANY_GSTIN   || "33ABCDE1234F1Z5",
        logo:    process.env.COMPANY_LOGO    || null,
      },

      // clientName / clientEmail are the billing contact captured at
      // intent creation time and must be the primary source.
      customer: {
        name:    subscription.clientName  || subscription.userId?.name    || "Unknown",
        email:   subscription.clientEmail || subscription.userId?.email   || "N/A",
        phone:   subscription.userId?.phone   || null,
        address: subscription.userId?.address || "India",
        gstin:   subscription.userId?.gstin   || null,
      },

      // getInrPrice always returns the canonical INR plan price regardless of
      // what currency was used for the PayPal order. sub.amount is NOT used
      // here because createOrder may have overwritten it with the USD amount.
      items: [
        {
          name:        `${(subscription.plan || "").charAt(0).toUpperCase() + (subscription.plan || "").slice(1)} Plan Subscription`,
          description: `Billing Cycle: ${subscription.billingCycle}`,
          qty:         1,
          price:       getInrPrice(subscription.plan, subscription.billingCycle),
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
      // GST CONFIG
      // intra-state: CGST 9% + SGST 9% (IGST = 0)
      // inter-state: IGST 18% only   (CGST = SGST = 0)
      // ======================================================
      tax: {
        type: req.body.taxType || "intra",
        cgst: req.body.taxType === "inter" ? 0 : 9,
        sgst: req.body.taxType === "inter" ? 0 : 9,
        igst: req.body.taxType === "inter" ? 18 : 0,
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
        name:    process.env.COMPANY_NAME    || "ReadyTechSolutions Pvt Ltd",
        address: process.env.COMPANY_ADDRESS || "Coimbatore, Tamil Nadu, India",
        email:   process.env.COMPANY_MAIL    || "support@readytechsolutions.in",
        phone:   process.env.COMPANY_PHONE   || "+91-9876543210",
        gstin:   process.env.COMPANY_GSTIN   || "33ABCDE1234F1Z5",
      },

      customer: {
        name:    subscription.clientName  || subscription.userId?.name  || "Customer",
        email:   subscription.clientEmail || subscription.userId?.email || "N/A",
        address: "India",
      },

      items: [
        {
          name:        `${(subscription.plan || "").charAt(0).toUpperCase() + (subscription.plan || "").slice(1)} Plan Subscription`,
          description: `Billing Cycle: ${subscription.billingCycle}`,
          qty:         1,
          price:       getInrPrice(subscription.plan, subscription.billingCycle),
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
      // Cancel competing active/pending subs BEFORE activating to avoid E11000
      await Subscription.updateMany(
        { companyId: sub.companyId, status: { $in: ["pending", "active"] }, _id: { $ne: sub._id } },
        { $set: { status: "cancelled", cancelledAt: new Date(), autoRenew: false } }
      );

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

// ======================================================
// REGENERATE INVOICE (ADMIN)
// POST /api/v1/subscription/:id/invoice/regenerate
// ======================================================
exports.regenerateInvoice = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id).populate("userId");

    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    const paymentStatus = subscription.paymentStatus === "paid" ? "PAID" : "PENDING";

    const invoiceData = {
      company: {
        name:    process.env.COMPANY_NAME    || "ReadyTechSolutions Pvt Ltd",
        address: process.env.COMPANY_ADDRESS || "Coimbatore, Tamil Nadu, India",
        email:   process.env.COMPANY_MAIL    || "support@readytechsolutions.in",
        phone:   process.env.COMPANY_PHONE   || "+91-9876543210",
        gstin:   process.env.COMPANY_GSTIN   || "33ABCDE1234F1Z5",
      },
      customer: {
        name:    subscription.clientName  || subscription.userId?.name  || "Customer",
        email:   subscription.clientEmail || subscription.userId?.email || "N/A",
        address: "India",
      },
      subscription: {
        plan:        subscription.plan,
        billingCycle: subscription.billingCycle,
        status:      subscription.status,
        renewalDate: subscription.renewalDate,
      },
      items: [
        {
          name:        `${(subscription.plan || "").charAt(0).toUpperCase() + (subscription.plan || "").slice(1)} Plan Subscription`,
          description: `Billing Cycle: ${subscription.billingCycle}`,
          qty:         1,
          price:       getInrPrice(subscription.plan, subscription.billingCycle),
        },
      ],
      discount: 0,
      cgst: 9,
      sgst: 9,
      igst: 0,
      paymentStatus,
      orderDate: subscription.createdAt,
    };

    const invoice = await InvoiceService.generateInvoice(invoiceData);

    subscription.invoice = {
      invoiceId: invoice.invoice.invoiceId,
      url: `/uploads/invoices/${invoice.invoice.fileName}`,
      generatedAt: new Date(),
    };
    await subscription.save();

    return res.json({
      success: true,
      message: "Invoice regenerated successfully",
      data: invoice,
    });
  } catch (err) {
    console.error("Regenerate invoice error:", err);
    return res.status(500).json({ success: false, message: err.message || "Invoice regeneration failed" });
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