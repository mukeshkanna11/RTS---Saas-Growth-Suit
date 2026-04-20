const bcrypt = require("bcryptjs");
const User = require("./user.model");

// --------------------------------------
// 👥 GET ALL USERS (Tenant Safe)
// --------------------------------------
exports.getAllUsers = async (tenantId) => {
  return await User.find({
    tenantId,
    isDeleted: false,
  }).select("-password -refreshToken");
};

// --------------------------------------
// 👤 GET USER BY ID
// --------------------------------------
exports.getUserById = async (userId, tenantId) => {
  const user = await User.findOne({
    _id: userId,
    tenantId,
    isDeleted: false,
  }).select("-password -refreshToken");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

// --------------------------------------
// ➕ CREATE USER (Admin Only)
// --------------------------------------
exports.createUser = async (data, tenantId) => {
  try {
    const { name, email, password, role } = data;

    if (role === "admin") {
      throw new Error("Cannot create admin user");
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
      tenantId,
    });

    if (existingUser) {
      throw new Error("User already exists in this company");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      tenantId,
    });

    user.password = undefined;
    user.refreshToken = undefined;

    return user;

  } catch (err) {

    // 🔥 HANDLE MONGO DUPLICATE ERROR
    if (err.code === 11000) {
      throw new Error("User already exists in this company");
    }

    throw err;
  }
};

// --------------------------------------
// ✏️ UPDATE USER
// --------------------------------------
exports.updateUser = async (userId, tenantId, data) => {

  // 🔐 If password update
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  // 🔥 Prevent role escalation to admin
  if (data.role === "admin") {
    throw new Error("Cannot assign admin role");
  }

  const user = await User.findOneAndUpdate(
    { _id: userId, tenantId, isDeleted: false },
    data,
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

// --------------------------------------
// ❌ DELETE USER (SOFT DELETE)
// --------------------------------------
exports.deleteUser = async (userId, tenantId) => {
  const user = await User.findOneAndUpdate(
    { _id: userId, tenantId },
    { isDeleted: true },
    { new: true }
  );

  if (!user) {
    throw new Error("User not found");
  }

  return { message: "User deleted successfully" };
};