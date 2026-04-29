// ======================================================
// SUBSCRIPTION SERVICE (PRODUCTION-READY SAAS CORE)
// ======================================================

const mongoose = require("mongoose");
const Subscription = require("./subscription.model");
const { getPlan } = require("./subscription.plans");

// ======================================================
// CREATE SUBSCRIPTION INTENT
// ======================================================
const createSubscriptionIntent = async ({
  companyId,
  clientName,
  clientEmail,
  plan,
  billingCycle = "monthly",
}) => {
  const selectedPlan = getPlan(plan);

  if (!selectedPlan) {
    throw new Error("Invalid subscription plan");
  }

  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    throw new Error("Invalid company ID");
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

  return subscription;
};

// ======================================================
// CONFIRM PAYMENT
// ======================================================
const confirmPayment = async ({ subscriptionId, transactionId }) => {
  if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
    throw new Error("Invalid subscription ID");
  }

  const subscription = await Subscription.findById(subscriptionId);

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  subscription.paymentStatus = "paid";
  subscription.status = "active";
  subscription.transactionId = transactionId;

  const renewal = new Date();

  if (subscription.billingCycle === "yearly") {
    renewal.setFullYear(renewal.getFullYear() + 1);
  } else {
    renewal.setMonth(renewal.getMonth() + 1);
  }

  subscription.renewalDate = renewal;

  await subscription.save();

  return subscription;
};

// ======================================================
// GET CURRENT USER SUBSCRIPTION
// ======================================================
const getMySubscription = async ({ companyId, email }) => {
  let query = null;

  if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
    query = { companyId };
  } else if (email) {
    query = { clientEmail: email };
  } else {
    throw new Error("Missing subscription lookup info");
  }

  const subscription = await Subscription.findOne(query)
    .sort({ createdAt: -1 });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  return subscription;
};

// ======================================================
// GET ALL SUBSCRIPTIONS
// ======================================================
const getAllSubscriptions = async () => {
  return await Subscription.find()
    .populate("companyId")
    .sort({ createdAt: -1 });
};

// ======================================================
// CHANGE PLAN
// ======================================================
const changePlan = async ({
  subscriptionId,
  plan,
  billingCycle = "monthly",
}) => {
  if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
    throw new Error("Invalid subscription ID");
  }

  const subscription = await Subscription.findById(subscriptionId);

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  const selectedPlan = getPlan(plan);

  if (!selectedPlan) {
    throw new Error("Invalid plan");
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
  subscription.modules = selectedPlan.modules;

  await subscription.save();

  return subscription;
};

// ======================================================
// CANCEL SUBSCRIPTION
// ======================================================
const cancelSubscription = async (subscriptionId) => {
  if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
    throw new Error("Invalid subscription ID");
  }

  const subscription = await Subscription.findByIdAndUpdate(
    subscriptionId,
    { status: "cancelled" },
    { new: true }
  );

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  return subscription;
};

// ======================================================
// REACTIVATE SUBSCRIPTION
// ======================================================
const reactivateSubscription = async (subscriptionId) => {
  if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
    throw new Error("Invalid subscription ID");
  }

  const subscription = await Subscription.findByIdAndUpdate(
    subscriptionId,
    { status: "active" },
    { new: true }
  );

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  return subscription;
};

// ======================================================
// ANALYTICS
// ======================================================
const getAnalytics = async () => {
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

  return {
    totalSubscriptions,
    activeSubscriptions,
    cancelledSubscriptions,
    totalRevenue: revenue[0]?.totalRevenue || 0,
  };
};

module.exports = {
  createSubscriptionIntent,
  confirmPayment,
  getMySubscription,
  getAllSubscriptions,
  changePlan,
  cancelSubscription,
  reactivateSubscription,
  getAnalytics,
};