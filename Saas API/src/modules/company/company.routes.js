const express = require("express");
const router = express.Router();
const controller = require("./company.controller");
const { protect, authorize } = require("../../middleware/auth.middleware");

// Only logged in users can view their company


// Only admin can update company
router.put("/", protect, authorize("admin"), controller.updateCompany);

module.exports = router; 