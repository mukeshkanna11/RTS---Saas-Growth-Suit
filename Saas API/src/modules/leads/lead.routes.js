const express = require("express");
const router = express.Router();

const {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  assignLead,
  updateStatus,
  addFollowUp,
  addNote,
  addActivity,
  convertLead,
  importCSV,
  getPipelineStats,
  getTodayFollowUps,
  getTeamLeads,
  getMyLeads,
} = require("./lead.controller");

const validate = require("../../middleware/validate.middleware");
const { protect, authorize } = require("../../middleware/auth.middleware");
const upload = require("../../middleware/upload");

const {
  createLeadSchema,
  updateLeadSchema,
  assignLeadSchema,
  updateStatusSchema,
  getLeadsQuerySchema,
  followUpSchema,
  addNoteSchema,
  addActivitySchema,
} = require("./lead.validation");

// ======================================================
// 🔐 GLOBAL AUTH
// ======================================================
router.use(protect);

// ======================================================
// 📊 DASHBOARD / STATS
// ======================================================
router.get(
  "/pipeline",
  authorize("admin", "manager"),
  getPipelineStats
);

router.get(
  "/followups/today",
  getTodayFollowUps
);

// ======================================================
// 👥 ROLE BASED LEADS
// ======================================================

// Manager → Team Leads
router.get(
  "/team",
  authorize("manager", "admin"),
  getTeamLeads
);

// Employee → Own Leads
router.get(
  "/my",
  getMyLeads
);

// ======================================================
// 📂 IMPORT CSV
// ======================================================
router.post(
  "/import",
  authorize("admin", "manager"),
  upload.single("file"),
  importCSV
);

// ======================================================
// 🟢 CREATE LEAD
// ======================================================
router.post(
  "/",
  authorize("admin", "manager"),
  validate(createLeadSchema),
  createLead
);

// ======================================================
// 📥 GET LEADS
// ======================================================
router.get(
  "/",
  validate(getLeadsQuerySchema, "query"),
  getLeads
);

router.get(
  "/:id",
  getLeadById
);

// ======================================================
// ✏️ UPDATE LEAD
// ======================================================
router.patch(
  "/:id",
  authorize("admin", "manager"),
  validate(updateLeadSchema),
  updateLead
);

// ======================================================
// 👤 ASSIGN LEAD
// ======================================================
router.patch(
  "/:id/assign",
  authorize("admin", "manager"),
  validate(assignLeadSchema),
  assignLead
);

// ======================================================
// 🔄 UPDATE STATUS
// ======================================================
router.patch(
  "/:id/status",
  validate(updateStatusSchema),
  updateStatus
);

// ======================================================
// 🔔 FOLLOW UP
// ======================================================
router.patch(
  "/:id/followup",
  validate(followUpSchema),
  addFollowUp
);

// ======================================================
// 📝 ADD NOTE
// ======================================================
router.post(
  "/:id/notes",
  validate(addNoteSchema),
  addNote
);

// ======================================================
// 📜 ADD ACTIVITY
// ======================================================
router.post(
  "/:id/activity",
  validate(addActivitySchema),
  addActivity
);

// ======================================================
// 🔥 CONVERT LEAD
// ======================================================
router.patch(
  "/:id/convert",
  authorize("admin", "manager"),
  convertLead
);

// ======================================================
// ❌ DELETE LEAD
// ======================================================
router.delete(
  "/:id",
  authorize("admin"),
  deleteLead
);

module.exports = router;