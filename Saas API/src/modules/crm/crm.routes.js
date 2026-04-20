const express = require("express");
const router = express.Router();

// 🔐 AUTH ONLY (NO TENANT MIDDLEWARE)
const { protect } = require("../../middleware/auth.middleware");

// 📦 MODULE ROUTES
const contactRoutes = require("./contacts/contact.routes");
const dealRoutes = require("./deals/deal.routes");
const activityRoutes = require("./activities/activity.routes");
const noteRoutes = require("./notes/note.routes");

// -------------------------------
// 🔐 GLOBAL AUTH PROTECTION
// -------------------------------
router.use(protect);

// -------------------------------
// 🚀 MODULE REGISTRATION
// -------------------------------
router.use("/contacts", contactRoutes);
router.use("/deals", dealRoutes);
router.use("/activities", activityRoutes);
router.use("/notes", noteRoutes);

// -------------------------------
// ❤️ HEALTH CHECK
// -------------------------------
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CRM API working 🚀 (No Tenant Layer)",
    userId: req.user._id,
    companyId: req.user.companyId || null,
  });
});

module.exports = router;