const express = require("express");
const router = express.Router();

const controller = require("./lead.controller");
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

// 🔐 GLOBAL AUTH
router.use(protect);

// ----------------------
// 📊 STATS
// ----------------------
router.get(
  "/pipeline",
  authorize("admin", "manager"),
  controller.getPipelineStats
);

router.get("/followups/today", controller.getTodayFollowUps);

// ----------------------
// 📂 IMPORT
// ----------------------
router.post(
  "/import",
  authorize("admin", "manager"),
  upload.single("file"),
  controller.importCSV
);

// ----------------------
// 🟢 CREATE
// ----------------------
router.post(
  "/",
  authorize("admin", "manager"),
  validate(createLeadSchema),
  controller.createLead
);

// ----------------------
// 📥 GET
// ----------------------
router.get(
  "/",
  validate(getLeadsQuerySchema, "query"),
  controller.getLeads
);

router.get("/:id", controller.getLeadById);

// ----------------------
// ✏️ UPDATE
// ----------------------
router.patch(
  "/:id",
  authorize("admin", "manager"),
  validate(updateLeadSchema),
  controller.updateLead
);

// ----------------------
// 👤 ASSIGN
// ----------------------
router.patch(
  "/:id/assign",
  authorize("admin", "manager"),
  validate(assignLeadSchema),
  controller.assignLead
);

// ----------------------
// 🔄 STATUS
// ----------------------
router.patch(
  "/:id/status",
  validate(updateStatusSchema),
  controller.updateStatus
);

// ----------------------
// 🔔 FOLLOW UP
// ----------------------
router.patch(
  "/:id/followup",
  validate(followUpSchema),
  controller.addFollowUp
);

// ----------------------
// 📝 NOTES
// ----------------------
router.post(
  "/:id/notes",
  validate(addNoteSchema),
  controller.addNote
);

// ----------------------
// 📜 ACTIVITY
// ----------------------
router.post(
  "/:id/activity",
  validate(addActivitySchema),
  controller.addActivity
);

// ----------------------
// 🔥 CONVERT
// ----------------------
router.patch(
  "/:id/convert",
  authorize("admin", "manager"),
  controller.convertLead
);

// ----------------------
// ❌ DELETE
// ----------------------
router.delete(
  "/:id",
  authorize("admin"),
  controller.deleteLead
);

module.exports = router;