const userService = require("./user.service");

/* =========================================
   👥 GET USERS
========================================= */
exports.getUsersController = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await userService.getAllUsers(
      req.user.tenantId,
      req.user,
      req.query
    );

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    console.error("GET USERS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch users",
    });
  }
};

/* =========================================
   👤 GET SINGLE USER
========================================= */
exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(
      req.params.id,
      req.user.tenantId,
      req.user
    );

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================================
   👤 GET PROFILE (SELF)
========================================= */
exports.getProfile = async (req, res) => {
  try {
    const user = await userService.getUserById(
      req.user.id,
      req.user.tenantId,
      req.user
    );

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================================
   ➕ CREATE USER
   ADMIN → manager / employee / client
========================================= */
exports.createUser = async (req, res) => {
  try {
    const user = await userService.createUser(
      req.body,
      req.user.tenantId,
      req.user
    );

    return res.status(201).json({
      success: true,
      message: `${user.role} created successfully`,
      data: user,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================================
   ✏️ UPDATE USER
========================================= */
exports.updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(
      req.params.id,
      req.user.tenantId,
      req.body,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================================
   🧨 UPDATE USER ROLE
   STRICT ADMIN ONLY
========================================= */
exports.updateUserRole = async (req, res) => {
  try {
    // 🔥 only admin can update role
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can update roles",
      });
    }

    const user = await userService.updateUser(
      req.params.id,
      req.user.tenantId,
      {
        role: req.body.role,
      },
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: user,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================================
   ❌ DELETE USER
========================================= */
exports.deleteUser = async (req, res) => {
  try {
    const result = await userService.deleteUser(
      req.params.id,
      req.user.tenantId,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};