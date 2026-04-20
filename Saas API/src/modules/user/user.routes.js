const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../../middleware/auth.middleware");

// ✅ IMPORT ALL CONTROLLERS PROPERLY
const userController = require("./user.controller");

// =====================================================
// 🏢 USER MANAGEMENT (ADMIN ONLY)
// Base: /api/v1/users
// =====================================================

// 🔥 Get all users
router.get(
  "/",
  protect,
  authorize("admin"),
  userController.getUsersController
);

// 🔥 Create user
router.post(
  "/",
  protect,
  authorize("admin"),
  userController.createUser
);

// 🔥 Update user role
router.put(
  "/:id/role",
  protect,
  authorize("admin"),
  userController.updateUserRole
);

// 🔥 Delete user
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  userController.deleteUser
);

// =====================================================
// 👤 PROFILE (ALL LOGGED IN USERS)
// =====================================================

router.get(
  "/profile",
  protect,
  userController.getProfile
);

// =====================================================
// 🧪 TEST ROUTES
// =====================================================

// Admin test
router.get(
  "/test/admin",
  protect,
  authorize("admin"),
  (req, res) => {
    res.json({
      success: true,
      message: "Admin access granted ✅",
    });
  }
);

// Manager test
router.get(
  "/test/manager",
  protect,
  authorize("admin", "manager"),
  (req, res) => {
    res.json({
      success: true,
      message: "Manager access granted ✅",
    });
  }
);

module.exports = router;