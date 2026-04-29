const mongoose = require("mongoose");
const Subscription = require("./subscription.model");
const { getPlan } = require("./subscription.plans");
const EmailService = require("../../services/email.service");

/**
 * ======================================================
 * SUBSCRIPTION CONTROLLER - RTS SAAS
 * Enterprise-ready subscription lifecycle + mail flow
 * ======================================================
 */

// ======================================================
// CREATE SUBSCRIPTION INTENT
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

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID",
      });
    }

    const selectedPlan = getPlan(plan);

    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan",
      });
    }

    const amount =
      billingCycle === "yearly"
        ? selectedPlan.pricing.yearly
        : selectedPlan.pricing.monthly;

    const subscription = await Subscription.create({
      companyId,
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

    return res.status(201).json({
      success: true,
      message: "Subscription intent created",
      data: subscription,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// CONFIRM PAYMENT
// ======================================================
exports.confirmPayment = async (req, res) => {
  try {
    const { subscriptionId, transactionId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription ID",
      });
    }

    const sub = await Subscription.findById(subscriptionId);

    if (!sub) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    sub.paymentStatus = "paid";
    sub.status = "active";
    sub.transactionId = transactionId;

    const renewal = new Date();

    if (sub.billingCycle === "yearly") {
      renewal.setFullYear(renewal.getFullYear() + 1);
    } else {
      renewal.setMonth(renewal.getMonth() + 1);
    }

    sub.renewalDate = renewal;

    await sub.save();

    return res.json({
      success: true,
      message: "Payment confirmed",
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
// GET MY SUBSCRIPTION
// ======================================================
exports.getMySubscription = async (req, res) => {
  try {
    const query = req.user.companyId
      ? { companyId: req.user.companyId }
      : { clientEmail: req.user.email };

    const data = await Subscription.findOne(query).sort({ createdAt: -1 });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// GET ALL
// ======================================================
exports.getAll = async (req, res) => {
  try {
    const data = await Subscription.find()
      .populate("companyId")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// CHANGE PLAN
// ======================================================
exports.changePlan = async (req, res) => {
  try {
    const { plan, billingCycle = "monthly" } = req.body;

    const sub = await Subscription.findById(req.params.id);

    if (!sub) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    const selectedPlan = getPlan(plan);

    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan",
      });
    }

    const amount =
      billingCycle === "yearly"
        ? selectedPlan.pricing.yearly
        : selectedPlan.pricing.monthly;

    sub.plan = selectedPlan.id;
    sub.billingCycle = billingCycle;
    sub.amount = amount;
    sub.projectsIncluded = selectedPlan.limits.projectsIncluded;
    sub.teamMembers = selectedPlan.limits.teamMembers;
    sub.modules = selectedPlan.modules;

    await sub.save();

    return res.json({
      success: true,
      message: "Plan updated successfully",
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
// CANCEL SUBSCRIPTION
// ======================================================
exports.cancel = async (req, res) => {
  try {
    const sub = await Subscription.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );

    if (!sub) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    return res.json({
      success: true,
      message: "Subscription cancelled",
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
// UPGRADE REQUEST
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

    // ---------------- VALIDATION ----------------
    if (!name || !email || !plan) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and plan are required",
      });
    }

    // ---------------- INSTANT RESPONSE ----------------
    res.status(200).json({
      success: true,
      message: "Upgrade request submitted successfully",
    });

    // ---------------- BACKGROUND TASK ----------------
    process.nextTick(async () => {
      try {
        const safePayload = {
          name,
          email,
          phone: phone || "N/A",
          company: company || "N/A",
          address: address || "N/A",
          notes: notes || "N/A",
          plan,
          billingCycle: billingCycle || "monthly",
        };

        // Run both emails in parallel
        await Promise.allSettled([
          EmailService.sendSubscriptionLead(safePayload),
          EmailService.sendCustomerConfirmation({
            email,
            name,
            plan,
          }),
        ]);

        console.log("✅ Background emails processed");
      } catch (err) {
        console.error("❌ Background email task failed:", err.message);
      }
    });
  } catch (err) {
    console.error("❌ Upgrade request failed:", err.message);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
};

// ======================================================
// ANALYTICS
// ======================================================
exports.analytics = async (req, res) => {
  try {
    const total = await Subscription.countDocuments();
    const active = await Subscription.countDocuments({ status: "active" });

    const revenue = await Subscription.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]);

    return res.json({
      success: true,
      data: {
        totalSubscriptions: total,
        activeSubscriptions: active,
        totalRevenue: revenue[0]?.totalRevenue || 0,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};