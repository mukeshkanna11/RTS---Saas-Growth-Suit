// ========================================
// analytics.validation.js
// ========================================

const Joi = require("joi");

exports.analyticsValidation = Joi.object({
  source: Joi.string().valid(
    "website",
    "campaign",
    "crm",
    "sales",
    "manual"
  ),

  category: Joi.string()
    .valid(
      "lead_generation",
      "conversion",
      "revenue",
      "campaign_performance",
      "user_activity",
      "traffic"
    )
    .required(),

  metricName: Joi.string().required(),

  value: Joi.number().required(),

  unit: Joi.string(),

  meta: Joi.object(),
});
