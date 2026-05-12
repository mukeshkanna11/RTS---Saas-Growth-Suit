const express = require("express");
const router = express.Router();

const authController = require("./auth.controller");
const { protect, authorize } =
  require("../../middleware/auth.middleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", protect, authController.logout);

// ⭐ IMPORTANT ROUTE
router.get("/me", protect, authController.me);

module.exports = router;