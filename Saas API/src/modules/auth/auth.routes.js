const express = require("express");

const router = express.Router();

const authController = require("./auth.controller");

const {
  protect,
  authorize,
} = require("../../middleware/auth.middleware");

/* =========================================
   PUBLIC ROUTES
========================================= */

// 🔐 Register Tenant + Admin
router.post(
  "/register",
  authController.register
);

// 🔐 Login
router.post(
  "/login",
  authController.login
);

/* =========================================
   PROTECTED ROUTES
========================================= */

// 🚪 Logout
router.post(
  "/logout",
  protect,
  authController.logout
);

// 👤 Current Logged User
router.get(
  "/me",
  protect,
  authController.me
);

/* =========================================
   ROLE TEST ROUTES (OPTIONAL)
========================================= */

// 👑 Admin Only
router.get(
  "/admin-only",
  protect,
  authorize("admin"),
  (req, res) => {
    return res.json({
      success: true,
      message: "Welcome Admin",
    });
  }
);

// 👨‍💼 Admin + Manager
router.get(
  "/management",
  protect,
  authorize("admin", "manager"),
  (req, res) => {
    return res.json({
      success: true,
      message: "Management Access Granted",
    });
  }
);

// 👤 Client Access
router.get(
  "/client-area",
  protect,
  authorize("client"),
  (req, res) => {
    return res.json({
      success: true,
      message: "Client Access Granted",
    });
  }
);

module.exports = router;