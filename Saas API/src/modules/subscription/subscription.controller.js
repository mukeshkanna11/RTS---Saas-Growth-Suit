// ======================================================
// src/modules/subscription/subscription.controller.js
// FULL UPDATED SAAS-LEVEL CONTROLLER (FIXED FOR NEW PLAN STRUCTURE)
// ======================================================

const Subscription = require("./subscription.model");
const plans = require("./subscription.plans");
const { sendSubscriptionEmails } = require("../../services/email.service");

// ======================================================
// HELPER
// ======================================================
const getSelectedPlan = (planKey) => {
  if (!planKey) return null;
  return plans[planKey.toLowerCase()] || null;
};

// ======================================================
// CREATE SUBSCRIPTION
// ======================================================
exports.createSubscription = async (req, res) => {
  try {
    const {
      companyId,
      clientName,
      clientEmail,
      plan,
      billingCycle = "monthly",
    } = req.body;

    const selectedPlan = getSelectedPlan(plan);

    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan",
      });
    }

    const renewalDate = new Date();
    renewalDate.setMonth(
      renewalDate.getMonth() + (billingCycle === "yearly" ? 12 : 1)
    );

    const finalAmount =
      billingCycle === "yearly"
        ? selectedPlan.pricing.yearly
        : selectedPlan.pricing.monthly;

    const subscription = await Subscription.create({
      companyId,
      clientName,
      clientEmail,
      plan: selectedPlan.id,
      billingCycle,
      amount: finalAmount,
      projectsIncluded: selectedPlan.limits.projectsIncluded,
      teamMembers: selectedPlan.limits.teamMembers,
      modules: selectedPlan.modules,
      renewalDate,
      status: "active",
    });

    if (sendSubscriptionEmails) {
      await sendSubscriptionEmails({
        clientName,
        clientEmail,
        plan: selectedPlan.name,
        amount: finalAmount,
      });
    }

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: subscription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET ALL SUBSCRIPTIONS
// ======================================================
exports.getAllSubscriptions = async (req, res) => {
  try {
    const data = await Subscription.find().populate("companyId");

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET MY SUBSCRIPTION
// ======================================================
exports.getMySubscription = async (req, res) => {
  try {
    let query = {};

    if (req.user.companyId?.match(/^[0-9a-fA-F]{24}$/)) {
      query.companyId = req.user.companyId;
    } else if (req.user.email) {
      query.clientEmail = req.user.email;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid user identity",
      });
    }

    const data = await Subscription.findOne(query);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET SINGLE SUBSCRIPTION
// ======================================================
exports.getSubscriptionById = async (req, res) => {
  try {
    const data = await Subscription.findById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// UPDATE SUBSCRIPTION
// ======================================================
exports.updateSubscription = async (req, res) => {
  try {
    const data = await Subscription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Subscription updated successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// DELETE SUBSCRIPTION
// ======================================================
exports.deleteSubscription = async (req, res) => {
  try {
    await Subscription.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Subscription deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// CHANGE PLAN
// ======================================================
exports.changePlan = async (req, res) => {
  try {
    const { plan, billingCycle = "monthly" } = req.body;

    const selectedPlan = getSelectedPlan(plan);

    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan",
      });
    }

    const finalAmount =
      billingCycle === "yearly"
        ? selectedPlan.pricing.yearly
        : selectedPlan.pricing.monthly;

    const data = await Subscription.findByIdAndUpdate(
      req.params.id,
      {
        plan: selectedPlan.id,
        billingCycle,
        amount: finalAmount,
        projectsIncluded: selectedPlan.limits.projectsIncluded,
        teamMembers: selectedPlan.limits.teamMembers,
        modules: selectedPlan.modules,
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Plan changed successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// CANCEL SUBSCRIPTION
// ======================================================
exports.cancelSubscription = async (req, res) => {
  try {
    const data = await Subscription.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );

    res.json({
      success: true,
      message: "Subscription cancelled",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// REACTIVATE SUBSCRIPTION
// ======================================================
exports.reactivateSubscription = async (req, res) => {
  try {
    const data = await Subscription.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    );

    res.json({
      success: true,
      message: "Subscription reactivated",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// ANALYTICS
// ======================================================
exports.subscriptionAnalytics = async (req, res) => {
  try {
    const totalSubscriptions = await Subscription.countDocuments();

    const activeSubscriptions = await Subscription.countDocuments({
      status: "active",
    });

    const cancelledSubscriptions = await Subscription.countDocuments({
      status: "cancelled",
    });

    const revenue = await Subscription.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalSubscriptions,
        activeSubscriptions,
        cancelledSubscriptions,
        totalRevenue: revenue[0]?.totalRevenue || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};