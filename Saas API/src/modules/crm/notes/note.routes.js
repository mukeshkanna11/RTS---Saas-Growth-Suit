const express = require("express");
const router = express.Router();

const ctrl = require("./note.controller");

// 🔐 CORRECT IMPORT (IMPORTANT)
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
router.delete("/:id", ctrl.remove);

module.exports = router;