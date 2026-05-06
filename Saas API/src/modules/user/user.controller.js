const userService = require("./user.service");

/* =========================================
   👥 GET USERS (ADMIN / MANAGER / EMPLOYEE)
========================================= */
exports.getUsersController = async (req, res) => {
  try {
    const result = await userService.getAllUsers(
      req.user.tenantId,
      req.user,
      req.query
    );

    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================================
   👤 GET SINGLE USER (BY ID)
========================================= */
exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(
      req.params.id,
      req.user.tenantId,
      req.user
    );

    return res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    return res.status(404).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================================
   👤 PROFILE (SELF)
========================================= */
exports.getProfile = async (req, res) => {
  try {
    const user = await userService.getUserById(
      req.user.id,
      req.user.tenantId,
      req.user
    );

    return res.json({
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
   ➕ CREATE USER (ADMIN ONLY)
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
      message: "User created successfully",
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
   ✏️ UPDATE USER / ROLE
========================================= */
exports.updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(
      req.params.id,
      req.user.tenantId,
      req.body,
      req.user
    );

    return res.json({
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
   🧨 UPDATE ROLE (STRICT ADMIN ONLY)
========================================= */
exports.updateUserRole = async (req, res) => {
  try {
    const user = await userService.updateUser(
      req.params.id,
      req.user.tenantId,
      { role: req.body.role },
      req.user
    );

    return res.json({
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
   ❌ DELETE USER (SOFT DELETE)
========================================= */
exports.deleteUser = async (req, res) => {
  try {
    const result = await userService.deleteUser(
      req.params.id,
      req.user.tenantId,
      req.user
    );

    return res.json({
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