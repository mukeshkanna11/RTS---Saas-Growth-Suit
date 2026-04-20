const express = require("express");
const router = express.Router();

const ctrl = require("./activity.controller");

// 🔐 CORRECT WAY (IMPORTANT FIX)
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
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;