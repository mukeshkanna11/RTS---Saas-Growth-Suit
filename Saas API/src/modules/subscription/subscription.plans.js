// ======================================================
// SUBSCRIPTION PLANS (SAAS READY)
// ======================================================

const subscriptionPlans = {
  starter: {
    id: "starter",
    name: "Starter Plan",
    tagline: "Perfect for startups",

    pricing: {
      monthly: 2999,
      yearly: 29990,
      currency: "INR",
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
  },

  growth: {
    id: "growth",
    name: "Growth Plan",

    pricing: {
      monthly: 7999,
      yearly: 79990,
      currency: "INR",
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
  },

  enterprise: {
    id: "enterprise",
    name: "Enterprise Plan",

    pricing: {
      monthly: 19999,
      yearly: 199990,
      currency: "INR",
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
  },
};

const getPlan = (key) => subscriptionPlans[key?.toLowerCase()] || null;

module.exports = {
  subscriptionPlans,
  getPlan,
};