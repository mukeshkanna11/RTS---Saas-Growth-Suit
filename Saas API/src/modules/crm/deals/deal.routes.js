const express = require("express");
const router = express.Router();

const ctrl = require("./deal.controller");

// 🔐 IMPORTANT FIX (correct destructuring)
const { protect } = require("../../../middleware/auth.middleware");

// -------------------------------
// 🔐 MIDDLEWARE
// -------------------------------
router.use(protect);

// -------------------------------
// 📦 ROUTES
// -------------------------------
router.post("/", ctrl.create);
router.get("/", ctrl.getAll);
router.put("/:id/stage", ctrl.updateStage);

module.exports = router;