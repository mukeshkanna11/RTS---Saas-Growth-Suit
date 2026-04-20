const Joi = require("joi");
const mongoose = require("mongoose");

// -------------------------------
// 🔥 OBJECT ID VALIDATOR
// -------------------------------
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ID");
  }
  return value;
};

// -------------------------------
// ENUMS (SYNC WITH MODEL)
// -------------------------------
const STATUS = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "converted",
  "lost",
];

const SOURCES = [
  "website",
  "facebook",
  "linkedin",
  "referral",
  "google",
  "ads",
  "other",
];

// -------------------------------
// 🟢 CREATE LEAD
// -------------------------------
exports.createLeadSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),

  email: Joi.string().email().optional(),

  phone: Joi.string().pattern(/^[0-9]{10}$/).optional(),

  companyName: Joi.string().max(150).optional(),
  jobTitle: Joi.string().max(100).optional(),
  website: Joi.string().uri().optional(),

  source: Joi.string().valid(...SOURCES).optional(),

  utm: Joi.object({
    source: Joi.string().optional(),
    medium: Joi.string().optional(),
    campaign: Joi.string().optional(),
  }).optional(),

  status: Joi.string().valid(...STATUS).optional(),

  pipelineStage: Joi.string().optional(),

  assignedTo: Joi.string().custom(objectId).optional(),

  tags: Joi.array().items(Joi.string()).optional(),

  followUpDate: Joi.date().optional(),
  nextAction: Joi.string().max(200).optional(),

  dealValue: Joi.number().min(0).optional(),

  notes: Joi.string().max(1000).optional(),

  capture: Joi.object({
    page: Joi.string().optional(),
    formId: Joi.string().optional(),
  }).optional(),
});

// -------------------------------
// ✏️ UPDATE LEAD
// -------------------------------
exports.updateLeadSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),

  companyName: Joi.string().optional(),
  jobTitle: Joi.string().optional(),
  website: Joi.string().uri().optional(),

  status: Joi.string().valid(...STATUS).optional(),
  pipelineStage: Joi.string().optional(),

  assignedTo: Joi.string().custom(objectId).optional(),

  tags: Joi.array().items(Joi.string()).optional(),

  followUpDate: Joi.date().optional(),
  nextAction: Joi.string().optional(),

  dealValue: Joi.number().optional(),

  notes: Joi.string().optional(),
});

// -------------------------------
// 👤 ASSIGN
// -------------------------------
exports.assignLeadSchema = Joi.object({
  userId: Joi.string().custom(objectId).required(),
});

// -------------------------------
// 🔄 STATUS UPDATE
// -------------------------------
exports.updateStatusSchema = Joi.object({
  status: Joi.string().valid(...STATUS).required(),
});

// -------------------------------
// 🔔 FOLLOW-UP
// -------------------------------
exports.followUpSchema = Joi.object({
  followUpDate: Joi.date().required(),
  nextAction: Joi.string().max(200).optional(),
});

// -------------------------------
// 📝 ADD NOTE
// -------------------------------
exports.addNoteSchema = Joi.object({
  text: Joi.string().max(1000).required(),
});

// -------------------------------
// 📜 ADD ACTIVITY
// -------------------------------
exports.addActivitySchema = Joi.object({
  type: Joi.string()
    .valid("call", "email", "whatsapp", "meeting", "note")
    .required(),

  note: Joi.string().max(1000).required(),
});

// -------------------------------
// 🔍 QUERY (ADVANCED FILTER)
// -------------------------------
exports.getLeadsQuerySchema = Joi.object({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional(),

  status: Joi.string().optional(),
  source: Joi.string().optional(),

  search: Joi.string().optional(),

  assignedTo: Joi.string().custom(objectId).optional(),

  fromDate: Joi.date().optional(),
  toDate: Joi.date().optional(),
});