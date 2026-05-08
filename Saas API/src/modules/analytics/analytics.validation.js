// =======================================================
// analytics.validation.js
// ENTERPRISE SAAS VALIDATION
// =======================================================

const Joi = require("joi");

exports.analyticsValidation = Joi.object({
  // =====================================================
  // COMPANY
  // =====================================================

  companyId: Joi.string().required(),

  workspaceId: Joi.string().allow(
    "",
    null
  ),

  // =====================================================
  // SOURCE
  // =====================================================

  source: Joi.string().valid(
    "website",
    "campaign",
    "crm",
    "sales",
    "manual",
    "api",
    "mobile_app",
    "integration"
  ),

  platform: Joi.string().allow(
    "",
    null
  ),

  // =====================================================
  // CATEGORY
  // =====================================================

  category: Joi.string()
    .valid(
      "lead_generation",
      "conversion",
      "revenue",
      "campaign_performance",
      "user_activity",
      "traffic",
      "engagement",
      "subscription",
      "retention",
      "sales_pipeline",
      "customer_success"
    )
    .required(),

  // =====================================================
  // METRIC
  // =====================================================

  metricName: Joi.string()
    .max(150)
    .required(),

  metricCode: Joi.string().allow(
    "",
    null
  ),

  description: Joi.string()
    .max(500)
    .allow("", null),

  value: Joi.number().required(),

  previousValue: Joi.number(),

  targetValue: Joi.number().allow(
    null
  ),

  unit: Joi.string().default("count"),

  currency: Joi.string().default("INR"),

  // =====================================================
  // FILTERING
  // =====================================================

  department: Joi.string().allow(
    "",
    null
  ),

  teamId: Joi.string().allow(
    "",
    null
  ),

  campaignId: Joi.string().allow(
    "",
    null
  ),

  leadId: Joi.string().allow(
    "",
    null
  ),

  customerId: Joi.string().allow(
    "",
    null
  ),

  // =====================================================
  // TAGS
  // =====================================================

  tags: Joi.array().items(
    Joi.string()
  ),

  labels: Joi.array().items(
    Joi.string()
  ),

  meta: Joi.object(),

  // =====================================================
  // GEO
  // =====================================================

  country: Joi.string().allow(
    "",
    null
  ),

  state: Joi.string().allow(
    "",
    null
  ),

  city: Joi.string().allow(
    "",
    null
  ),

  // =====================================================
  // DEVICE
  // =====================================================

  device: Joi.string().valid(
    "desktop",
    "mobile",
    "tablet",
    "server",
    "other"
  ),

  browser: Joi.string().allow(
    "",
    null
  ),

  os: Joi.string().allow(
    "",
    null
  ),

  // =====================================================
  // PERIOD
  // =====================================================

  periodType: Joi.string().valid(
    "hourly",
    "daily",
    "weekly",
    "monthly",
    "yearly"
  ),

  recordedAt: Joi.date(),

  // =====================================================
  // STATUS
  // =====================================================

  status: Joi.string().valid(
    "active",
    "archived",
    "draft"
  ),
});