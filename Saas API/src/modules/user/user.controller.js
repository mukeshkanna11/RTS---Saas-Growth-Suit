const User = require("./user.model");
const userService = require("./user.service");

// =====================================================
// 👥 GET ALL USERS (Admin only) - with pagination + search
// =====================================================
exports.getUsersController = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // 🔍 Query params
    const { page = 1, limit = 10, search = "", role } = req.query;

    const query = {
      tenantId,
      isDeleted: false,
    };

    // 🔍 Search by name/email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // 🎭 Filter by role
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select("-password -refreshToken")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: users,
    });

  } catch (err) {
    console.error("Get Users Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// 👤 GET PROFILE
// =====================================================
exports.getProfile = async (req, res) => {
  try {
    const user = await userService.getUserById(
      req.user.id,
      req.user.tenantId
    );

    res.json({
      success: true,
      data: user,
    });

  } catch (err) {
    console.error("Profile Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// ➕ CREATE USER (Admin only)
// =====================================================
exports.createUser = async (req, res) => {
  try {
    const { role, email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // 🔥 Prevent admin creation
    if (role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot create admin user",
      });
    }

    const user = await userService.createUser(
      req.body,
      req.user.tenantId
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });

  } catch (err) {
    console.error("Create User Error:", err.message);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// =====================================================
// 🔄 UPDATE USER ROLE (Admin only)
// =====================================================
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = ["manager", "employee"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: id,
        tenantId: req.user.tenantId,
        isDeleted: false,
      },
      { role },
      { new: true }
    ).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Role updated successfully",
      data: user,
    });

  } catch (err) {
    console.error("Update Role Error:", err.message);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// =====================================================
// ❌ DELETE USER (Soft delete)
// =====================================================
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.user.tenantId,
        isDeleted: false,
      },
      { isDeleted: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });

  } catch (err) {
    console.error("Delete User Error:", err.message);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};