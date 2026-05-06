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
// ENUMS
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
const createLeadSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().allow("", null).optional(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).allow("", null).optional(),

  companyName: Joi.string().max(150).optional(),
  jobTitle: Joi.string().max(100).optional(),
  website: Joi.string().uri().optional(),

  source: Joi.string().valid(...SOURCES).default("website"),
  status: Joi.string().valid(...STATUS).default("new"),

  pipelineStage: Joi.string().optional(),

  assignedTo: Joi.string().custom(objectId).optional(),

  tags: Joi.array().items(Joi.string()).default([]),

  followUpDate: Joi.date().optional(),
  nextAction: Joi.string().max(200).optional(),

  dealValue: Joi.number().min(0).default(0),

  notes: Joi.string().max(1000).optional(),

  capture: Joi.object({
    page: Joi.string().optional(),
    formId: Joi.string().optional(),
  }).optional(),
});

// -------------------------------
// ✏️ UPDATE LEAD
// -------------------------------
const updateLeadSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().allow("", null).optional(),
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
// 👤 ASSIGN LEAD
// -------------------------------
const assignLeadSchema = Joi.object({
  userId: Joi.string().custom(objectId).required(),
});

// -------------------------------
// 🔄 STATUS UPDATE
// -------------------------------
const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...STATUS).required(),
});

// -------------------------------
// 🔔 FOLLOW-UP
// -------------------------------
const followUpSchema = Joi.object({
  followUpDate: Joi.date().required(),
  nextAction: Joi.string().max(200).optional(),
});

// -------------------------------
// 📝 NOTE
// -------------------------------
const addNoteSchema = Joi.object({
  text: Joi.string().max(1000).required(),
});

// -------------------------------
// 📜 ACTIVITY
// -------------------------------
const addActivitySchema = Joi.object({
  type: Joi.string().valid("call", "email", "whatsapp", "meeting", "note").required(),
  note: Joi.string().max(1000).required(),
});

// -------------------------------
// 🔍 QUERY
// -------------------------------
const getLeadsQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),

  status: Joi.string().optional(),
  source: Joi.string().optional(),
  search: Joi.string().optional(),

  assignedTo: Joi.string().custom(objectId).optional(),

  fromDate: Joi.date().optional(),
  toDate: Joi.date().optional(),
});

module.exports = {
  createLeadSchema,
  updateLeadSchema,
  assignLeadSchema,
  updateStatusSchema,
  followUpSchema,
  addNoteSchema,
  addActivitySchema,
  getLeadsQuerySchema,
};