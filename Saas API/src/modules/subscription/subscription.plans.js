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
      // USD pricing for PayPal — set PAYPAL_CURRENCY=USD in .env
      usd: {
        monthly: 36,
        yearly: 360,
      },
    },

    limits: {
      projectsIncluded: 5,
      teamMembers: 5,
      storageGB: 50,
      apiRequestsPerMonth: 10000,
    },

    // AI token quota — 0 means unlimited
    aiTokensPerMonth: 150000,

    // Trial period in days — 0 means no trial
    trialDays: 14,

    modules: {
      leads: true,
      crm: true,
      analytics: false,
      automation: false,
      campaigns: false,
      erp: false,
      ai: true,
    },

    features: [
      "Basic CRM",
      "Lead Management",
      "AI Content Generator (150K tokens/mo)",
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
      usd: {
        monthly: 96,
        yearly: 960,
      },
    },

    limits: {
      projectsIncluded: 20,
      teamMembers: 20,
      storageGB: 250,
      apiRequestsPerMonth: 100000,
    },

    aiTokensPerMonth: 600000,
    trialDays: 14,

    modules: {
      leads: true,
      crm: true,
      analytics: true,
      automation: true,
      campaigns: true,
      erp: false,
      ai: true,
    },

    features: [
      "Advanced CRM",
      "Automation Tools",
      "Analytics Dashboard",
      "AI Content Generator (600K tokens/mo)",
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
      usd: {
        monthly: 240,
        yearly: 2400,
      },
    },

    limits: {
      projectsIncluded: 999,
      teamMembers: 999,
      storageGB: 5000,
      apiRequestsPerMonth: 9999999,
    },

    // 0 = unlimited
    aiTokensPerMonth: 0,
    trialDays: 0,

    modules: {
      leads: true,
      crm: true,
      analytics: true,
      automation: true,
      campaigns: true,
      erp: true,
      ai: true,
    },

    features: [
      "Full SaaS Suite",
      "ERP Access",
      "Unlimited AI Content Generation",
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

/**
 * getPriceForCurrency — single source of truth for plan pricing.
 *
 * @param {object|string} planOrId  — plan object OR plan ID string
 * @param {string}        billingCycle — "monthly" | "yearly"
 * @param {string}        currency     — "INR" (default) | "USD"
 * @returns {number} price in the requested currency
 *
 * Usage:
 *   getPriceForCurrency("growth", "yearly", "INR")   → 79990
 *   getPriceForCurrency("growth", "yearly", "USD")   → 960
 *   getPriceForCurrency(planObj,  "monthly", "INR")  → 7999
 */
const getPriceForCurrency = (planOrId, billingCycle, currency = "INR") => {
  const plan = typeof planOrId === "string" ? getPlan(planOrId) : planOrId;
  if (!plan) throw new Error(`Plan not found: ${planOrId}`);

  if (currency === "USD") {
    const price = billingCycle === "yearly"
      ? plan.pricing.usd?.yearly
      : plan.pricing.usd?.monthly;
    if (price == null) {
      throw new Error(
        `USD pricing not defined for plan '${plan.id}' / cycle '${billingCycle}'. ` +
        `Add pricing.usd.${billingCycle} to subscription.plans.js.`
      );
    }
    return price;
  }

  // Default: INR plan pricing — the canonical price for GST invoices
  return billingCycle === "yearly" ? plan.pricing.yearly : plan.pricing.monthly;
};

/**
 * getInrPrice — convenience wrapper that always returns the INR plan price.
 * Use this for every invoice calculation; never use sub.amount when the
 * subscription may have been created through a USD PayPal sandbox order.
 *
 * @param {object|string} planOrId   — plan object OR plan ID string
 * @param {string}        billingCycle — "monthly" | "yearly"
 * @returns {number} price in INR
 */
const getInrPrice = (planOrId, billingCycle) =>
  getPriceForCurrency(planOrId, billingCycle, "INR");

module.exports = {
  subscriptionPlans,
  getPlan,
  getAllPlans,
  getPopularPlan,
  getYearlySavings,
  getPriceForCurrency,
  getInrPrice,
};