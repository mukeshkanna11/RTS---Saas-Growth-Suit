const express = require("express");
const router = express.Router();

const controller = require("./lead.controller");
const validate = require("../../middleware/validate.middleware");

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

const { protect, authorize } = require("../../middleware/auth.middleware");
const upload = require("../../middleware/upload");

// ✅ CLEAN ASYNC HANDLER
const asyncHandler = (fn) => {
  return (req, res, next) => {
    if (typeof next !== "function") {
      return res.status(500).json({
        success: false,
        message: "next is not a function (asyncHandler)",
      });
    }

    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// -------------------------------
// 📊 PIPELINE STATS
// -------------------------------
router.get(
  "/pipeline",
  protect,
  authorize("admin", "manager"),
  asyncHandler(controller.getPipelineStats)
);

// -------------------------------
// 📅 TODAY FOLLOW-UPS
// -------------------------------
router.get(
  "/followups/today",
  protect,
  asyncHandler(controller.getTodayFollowUps)
);

// -------------------------------
// 📂 CSV IMPORT
// -------------------------------
router.post(
  "/import",
  protect,
  authorize("admin", "manager"),
  upload.single("file"),
  asyncHandler(controller.importCSV)
);

// -------------------------------
// 🟢 CREATE LEAD
// -------------------------------
router.post(
  "/",
  protect,
  authorize("admin", "manager"),
  validate(createLeadSchema),
  asyncHandler(controller.createLead)
);

// -------------------------------
// 📥 GET ALL LEADS
// -------------------------------
router.get(
  "/",
  protect,
  validate(getLeadsQuerySchema, "query"),
  asyncHandler(controller.getLeads)
);

// -------------------------------
// 🔍 GET SINGLE LEAD
// -------------------------------
router.get(
  "/:id",
  protect,
  asyncHandler(controller.getLeadById)
);

// -------------------------------
// ✏️ UPDATE LEAD
// -------------------------------
router.patch(
  "/:id",
  protect,
  authorize("admin", "manager"),
  validate(updateLeadSchema),
  asyncHandler(controller.updateLead)
);

// -------------------------------
// 👤 ASSIGN LEAD
// -------------------------------
router.patch(
  "/:id/assign",
  protect,
  authorize("admin", "manager"),
  validate(assignLeadSchema),
  asyncHandler(controller.assignLead)
);

// -------------------------------
// 🔄 UPDATE STATUS
// -------------------------------
router.patch(
  "/:id/status",
  protect,
  validate(updateStatusSchema),
  asyncHandler(controller.updateStatus)
);

// -------------------------------
// 🔔 ADD FOLLOW-UP
// -------------------------------
router.patch(
  "/:id/followup",
  protect,
  validate(followUpSchema),
  asyncHandler(controller.addFollowUp)
);

// -------------------------------
// 📝 ADD NOTE
// -------------------------------
router.post(
  "/:id/notes",
  protect,
  validate(addNoteSchema),
  asyncHandler(controller.addNote)
);

// -------------------------------
// 📜 ADD ACTIVITY
// -------------------------------
router.post(
  "/:id/activity",
  protect,
  validate(addActivitySchema),
  asyncHandler(controller.addActivity)
);

// -------------------------------
// 🔥 CONVERT LEAD
// -------------------------------
router.patch(
  "/:id/convert",
  protect,
  authorize("admin", "manager"),
  asyncHandler(controller.convertLead)
);

// -------------------------------
// ❌ DELETE LEAD
// -------------------------------
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  asyncHandler(controller.deleteLead)
);

module.exports = router;