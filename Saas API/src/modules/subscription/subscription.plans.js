const subscriptionPlans = {
  starter: {
    id: "starter",
    name: "Starter Plan",
    tagline: "Perfect for startups getting started",

    pricing: {
      monthly: 2999,
      yearly: 29990,
      currency: "INR",
      discountYearlyPercent: 17,
    },

    limits: {
      projectsIncluded: 5,
      teamMembers: 5,
      storageGB: 50,
      apiRequestsPerMonth: 10000,
    },

    modules: {
      leads: true,
      crm: true,
      analytics: false,
      automation: false,
      campaigns: false,
      erp: false,
    },

    features: [
      "Basic CRM",
      "Lead Management",
      "Email Support",
    ],

    isActive: true,
    isPopular: false,
  },

  growth: {
    id: "growth",
    name: "Growth Plan",
    tagline: "Best for growing teams",

    pricing: {
      monthly: 7999,
      yearly: 79990,
      currency: "INR",
      discountYearlyPercent: 17,
    },

    limits: {
      projectsIncluded: 20,
      teamMembers: 20,
      storageGB: 250,
      apiRequestsPerMonth: 100000,
    },

    modules: {
      leads: true,
      crm: true,
      analytics: true,
      automation: true,
      campaigns: true,
      erp: false,
    },

    features: [
      "Advanced CRM",
      "Automation Tools",
      "Analytics Dashboard",
      "Priority Support",
    ],

    isActive: true,
    isPopular: true,
  },

  enterprise: {
    id: "enterprise",
    name: "Enterprise Plan",
    tagline: "For large-scale organizations",

    pricing: {
      monthly: 19999,
      yearly: 199990,
      currency: "INR",
      discountYearlyPercent: 17,
    },

    limits: {
      projectsIncluded: 999,
      teamMembers: 999,
      storageGB: 5000,
      apiRequestsPerMonth: 9999999,
    },

    modules: {
      leads: true,
      crm: true,
      analytics: true,
      automation: true,
      campaigns: true,
      erp: true,
    },

    features: [
      "Full SaaS Suite",
      "ERP Access",
      "Dedicated Support",
      "Custom Integrations",
    ],

    isActive: true,
    isPopular: false,
  },
};

/**
 * ======================================================
 * PLAN UTILITIES (SAAS READY HELPERS)
 * ======================================================
 */

// Get single plan safely
const getPlan = (key) => {
  if (!key) return null;
  return subscriptionPlans[key.toLowerCase()] || null;
};

// Get all active plans
const getAllPlans = () => {
  return Object.values(subscriptionPlans).filter(
    (plan) => plan.isActive
  );
};

// Get popular plan (for UI highlight)
const getPopularPlan = () => {
  return Object.values(subscriptionPlans).find(
    (plan) => plan.isPopular
  );
};

// Calculate yearly savings
const getYearlySavings = (planKey) => {
  const plan = getPlan(planKey);
  if (!plan) return null;

  const monthlyTotal = plan.pricing.monthly * 12;
  const yearly = plan.pricing.yearly;

  return {
    saved: monthlyTotal - yearly,
    percent: plan.pricing.discountYearlyPercent,
  };
};

module.exports = {
  subscriptionPlans,
  getPlan,
  getAllPlans,
  getPopularPlan,
  getYearlySavings,
};