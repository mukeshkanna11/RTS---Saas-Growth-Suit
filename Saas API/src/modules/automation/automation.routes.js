const express = require("express");
const {
  createAutomation,
  getAutomations,
  getAutomationById,
  updateAutomation,
  deleteAutomation,
  toggleAutomation,
  testAutomation,
} = require("./automation.controller");

const { protect } = require("../../middleware/auth.middleware");

const router = express.Router();

// CRUD
router.post("/", protect, createAutomation);
router.get("/", protect, getAutomations);
router.get("/:id", protect, getAutomationById);
router.put("/:id", protect, updateAutomation);
router.delete("/:id", protect, deleteAutomation);

// SaaS Features
router.patch("/:id/toggle", protect, toggleAutomation);
router.post("/test", protect, testAutomation);

module.exports = router;