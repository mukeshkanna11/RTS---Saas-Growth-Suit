const bcrypt = require("bcryptjs");
const User = require("../user/user.model");

/* ==============================
   GET USERS (RBAC + TENANT SAFE)
============================== */
exports.getAllUsers = async (tenantId, currentUser, query) => {
  const { page = 1, limit = 10, search = "", role } = query;

  const filter = {
    tenantId,
    isDeleted: false,
  };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  if (role) filter.role = role;

  // 👇 RBAC restriction
  if (currentUser.role === "manager") {
    filter.managerId = currentUser._id;
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -refreshToken")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }),

    User.countDocuments(filter),
  ]);

  return {
    data: users,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    },
  };
};

/* ==============================
   GET USER BY ID
============================== */
exports.getUserById = async (id, tenantId) => {
  const user = await User.findOne({
    _id: id,
    tenantId,
    isDeleted: false,
  }).select("-password -refreshToken");

  if (!user) throw new Error("User not found");

  return user;
};

/* ==============================
   CREATE USER (ADMIN ONLY)
============================== */
exports.createUser = async (data, tenantId, currentUser) => {
  const { name, email, password, role } = data;

  if (currentUser.role !== "admin") {
    throw new Error("Only admin can create users");
  }

  if (role === "admin") {
    throw new Error("Cannot create admin user");
  }

  const existing = await User.findOne({
    email: email.toLowerCase(),
    tenantId,
  });

  if (existing) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role,
    tenantId,
    managerId:
      currentUser.role === "manager" ? currentUser._id : null,
  });

  return user.toObject({ getters: true });
};

/* ==============================
   UPDATE USER (SAFE RBAC)
============================== */
exports.updateUser = async (id, tenantId, data, currentUser) => {
  const user = await User.findOne({
    _id: id,
    tenantId,
    isDeleted: false,
  });

  if (!user) throw new Error("User not found");

  if (data.role === "admin") {
    throw new Error("Cannot assign admin role");
  }

  if (currentUser.role === "manager" && user.role !== "employee") {
    throw new Error("Not allowed");
  }

  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  Object.assign(user, data);

  await user.save();

  const clean = user.toObject();
  delete clean.password;

  return clean;
};

/* ==============================
   DELETE USER (SOFT DELETE)
============================== */
exports.deleteUser = async (id, tenantId, currentUser) => {
  if (currentUser.role !== "admin") {
    throw new Error("Only admin can delete users");
  }

  const user = await User.findOneAndUpdate(
    { _id: id, tenantId },
    { isDeleted: true },
    { new: true }
  );

  if (!user) throw new Error("User not found");

  return { message: "User deleted successfully" };
};