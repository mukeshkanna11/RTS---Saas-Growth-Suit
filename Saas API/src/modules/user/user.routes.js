const express = require("express");

const router = express.Router();

const {
  protect,
  authorize,
} = require("../../middleware/auth.middleware");

const userController = require("./user.controller");

/* =========================================
   👤 PROFILE ROUTE
   ALL LOGGED USERS
========================================= */
router.get(
  "/profile",
  protect,
  userController.getProfile
);

/* =========================================
   👥 GET USERS
========================================= */
/**
 * 👑 Admin → all users
 * 👨‍💼 Manager → team users
 */
router.get(
  "/",
  protect,
  authorize("admin", "manager"),
  userController.getUsersController
);

/* =========================================
   👤 GET SINGLE USER
========================================= */
/**
 * 👑 Admin → any user
 * 👨‍💼 Manager → team users
 * 👨‍💻 Employee → self
 * 👤 Client → self
 */
router.get(
  "/:id",
  protect,
  authorize(
    "admin",
    "manager",
    "employee",
    "client"
  ),
  userController.getUserById
);

/* =========================================
   ➕ CREATE USER
========================================= */
/**
 * 👑 Admin Only
 * Can create:
 * - manager
 * - employee
 * - client
 */
router.post(
  "/",
  protect,
  authorize("admin"),
  userController.createUser
);

/* =========================================
   ✏️ UPDATE USER
========================================= */
/**
 * 👑 Admin → any user
 * 👨‍💼 Manager → team employees
 * 👨‍💻 Employee → self
 * 👤 Client → self
 */
router.put(
  "/:id",
  protect,
  authorize(
    "admin",
    "manager",
    "employee",
    "client"
  ),
  userController.updateUser
);

/* =========================================
   🧨 UPDATE ROLE
========================================= */
/**
 * 👑 Admin Only
 */
router.put(
  "/:id/role",
  protect,
  authorize("admin"),
  userController.updateUserRole
);

/* =========================================
   ❌ DELETE USER
========================================= */
/**
 * 👑 Admin Only
 */
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  userController.deleteUser
);

module.exports = router;