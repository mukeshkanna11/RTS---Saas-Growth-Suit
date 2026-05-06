const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../../middleware/auth.middleware");
const userController = require("./user.controller");

/* =========================================
   🏢 USER MANAGEMENT ROUTES (SAAS RBAC)
========================================= */

/**
 * 👥 GET USERS
 * Admin → all users
 * Manager → team users
 */
router.get(
  "/",
  protect,
  authorize("admin", "manager"),
  userController.getUsersController
);

/**
 * 👤 GET SINGLE USER
 */
router.get(
  "/:id",
  protect,
  authorize("admin", "manager", "employee"),
  userController.getUserById
);

/**
 * ➕ CREATE USER (ADMIN ONLY)
 */
router.post(
  "/",
  protect,
  authorize("admin"),
  userController.createUser
);

/**
 * ✏️ UPDATE USER (ADMIN + MANAGER)
 */
router.put(
  "/:id",
  protect,
  authorize("admin", "manager"),
  userController.updateUser
);

/**
 * 🧨 UPDATE ROLE (ADMIN ONLY)
 */
router.put(
  "/:id/role",
  protect,
  authorize("admin"),
  userController.updateUserRole
);

/**
 * ❌ DELETE USER (ADMIN ONLY)
 */
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  userController.deleteUser
);

/* =========================================
   👤 PROFILE ROUTE
========================================= */
router.get(
  "/profile",
  protect,
  userController.getProfile
);

module.exports = router;