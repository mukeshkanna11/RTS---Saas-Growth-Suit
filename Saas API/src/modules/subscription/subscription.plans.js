// ======================================================
// src/modules/subscription/subscription.plans.js
// READYTECH SAAS PRICING STRATEGY CONFIG
// ======================================================

const subscriptionPlans = {
  starter: {
    id: "starter",
    name: "Starter Plan",
    tagline: "Perfect for startups and small businesses",

    pricing: {
      monthly: 2999,
      yearly: 29990,
      currency: "INR",
      display: "₹2,999 / month",
    },

    coreDescription:
      "Designed for early-stage businesses needing essential tools to manage leads and customer relationships.",

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
      "Lead Management",
      "Basic CRM Dashboard",
      "5 Active Projects",
      "Email Support",
      "50GB Secure Storage",
    ],
  },

  growth: {
    id: "growth",
    name: "Growth Plan",
    tagline: "Built for growing teams and scaling businesses",

    pricing: {
      monthly: 7999,
      yearly: 79990,
      currency: "INR",
      display: "₹7,999 / month",
    },

    coreDescription:
      "Advanced automation and analytics tools for companies ready to scale operations efficiently.",

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
      "Marketing Automation",
      "Analytics Dashboard",
      "20 Active Projects",
      "Priority Support",
      "250GB Storage",
    ],
  },

  enterprise: {
    id: "enterprise",
    name: "Enterprise Plan",
    tagline: "Complete business ecosystem for enterprises",

    pricing: {
      monthly: 19999,
      yearly: 199990,
      currency: "INR",
      display: "₹19,999 / month",
    },

    coreDescription:
      "Enterprise-grade platform with unlimited scalability, ERP access, and custom integrations.",

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
      "Unlimited Projects",
      "Dedicated Account Manager",
      "ERP Access",
      "Custom Integrations",
      "White Label Support",
      "5TB Enterprise Storage",
    ],
  },
};

// ======================================================
// HELPERS
// ======================================================

const getPlan = (planKey) => {
  if (!planKey) return null;
  return subscriptionPlans[planKey.toLowerCase()] || null;
};

const getAllPlans = () => subscriptionPlans;

module.exports = {
  ...subscriptionPlans,
  getPlan,
  getAllPlans,
};