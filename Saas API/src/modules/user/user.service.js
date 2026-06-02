const bcrypt = require("bcryptjs");
const User = require("../user/user.model");

/* =========================================
   GET USERS (RBAC + TENANT SAFE)
========================================= */
exports.getAllUsers = async (tenantId, currentUser, query) => {
  const { page = 1, limit = 10, search = "", role } = query;

  const filter = {
    tenantId,
    isDeleted: false,
  };

  /* =========================================
     SEARCH
  ========================================= */
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  /* =========================================
     ROLE FILTER
  ========================================= */
  if (role) {
    filter.role = role;
  }

  /* =========================================
     RBAC FILTERS
  ========================================= */

  // 👑 ADMIN → all users
  if (currentUser.role === "admin") {
    // no restriction
  }

  // 👨‍💼 MANAGER → only team users
  else if (currentUser.role === "manager") {
    filter.managerId = currentUser.id;

    // optional → managers should not see clients
    filter.role = { $in: ["employee"] };
  }

  // 👨‍💻 EMPLOYEE → only self
  else if (currentUser.role === "employee") {
    filter._id = currentUser.id;
  }

  // 👤 CLIENT → only self
  else if (currentUser.role === "client") {
    filter._id = currentUser.id;
  }

  const skip = (Number(page) - 1) * Number(limit);

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

/* =========================================
   GET SINGLE USER
========================================= */
exports.getUserById = async (id, tenantId, currentUser) => {
  const user = await User.findOne({
    _id: id,
    tenantId,
    isDeleted: false,
  }).select("-password -refreshToken");

  if (!user) {
    throw new Error("User not found");
  }

  /* =========================================
     RBAC ACCESS
  ========================================= */

  // 👑 ADMIN → all access
  if (currentUser.role === "admin") {
    return user;
  }

  // 👨‍💼 MANAGER → only employees under them
  if (
    currentUser.role === "manager" &&
    String(user.managerId) === String(currentUser.id)
  ) {
    return user;
  }

  // 👨‍💻 EMPLOYEE / CLIENT → only self
  if (String(user._id) === String(currentUser.id)) {
    return user;
  }

  throw new Error("Access denied");
};

/* =========================================
   CREATE USER
========================================= */
exports.createUser = async (data, tenantId, currentUser) => {
  const { name, email, password, role, managerId } = data;

  /* =========================================
     ONLY ADMIN CAN CREATE USERS
  ========================================= */
  if (currentUser.role !== "admin") {
    throw new Error("Only admin can create users");
  }

  /* =========================================
     PROTECT ADMIN CREATION
  ========================================= */
  if (role === "admin") {
    throw new Error("Cannot create admin user");
  }

  const allowedRoles = ["manager", "employee", "client"];

  if (!allowedRoles.includes(role)) {
    throw new Error("Invalid role");
  }

  const existing = await User.findOne({
    email: email.toLowerCase(),
    tenantId,
    isDeleted: false,
  });

  if (existing) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role,
    tenantId,

    // 👨‍💼 Optional manager
    managerId: managerId || null,
  });

  const clean = user.toObject();

  delete clean.password;
  delete clean.refreshToken;

  return clean;
};

/* =========================================
   UPDATE USER
========================================= */
exports.updateUser = async (
  id,
  tenantId,
  data,
  currentUser
) => {
  const user = await User.findOne({
    _id: id,
    tenantId,
    isDeleted: false,
  });

  if (!user) {
    throw new Error("User not found");
  }

  /* =========================================
     RBAC CHECKS
  ========================================= */

  // 👤 CLIENT cannot update others
  if (
    currentUser.role === "client" &&
    String(currentUser.id) !== String(user._id)
  ) {
    throw new Error("Access denied");
  }

  // 👨‍💻 EMPLOYEE only self
  if (
    currentUser.role === "employee" &&
    String(currentUser.id) !== String(user._id)
  ) {
    throw new Error("Access denied");
  }

  // 👨‍💼 MANAGER only employees under them
  if (
    currentUser.role === "manager" &&
    String(user.managerId) !== String(currentUser.id)
  ) {
    throw new Error("Access denied");
  }

  /* =========================================
     BLOCK ADMIN ASSIGNMENT
  ========================================= */
  if (data.role === "admin") {
    throw new Error("Cannot assign admin role");
  }

  /* =========================================
     PASSWORD HASH
  ========================================= */
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  Object.assign(user, data);

  await user.save();

  const clean = user.toObject();

  delete clean.password;
  delete clean.refreshToken;

  return clean;
};

/* =========================================
   DELETE USER
========================================= */
exports.deleteUser = async (
  id,
  tenantId,
  currentUser
) => {
  // 👑 ONLY ADMIN
  if (currentUser.role !== "admin") {
    throw new Error("Only admin can delete users");
  }

  const user = await User.findOneAndUpdate(
    {
      _id: id,
      tenantId,
      isDeleted: false,
    },
    {
      isDeleted: true,
      isActive: false,
    },
    {
      new: true,
    }
  );

  if (!user) {
    throw new Error("User not found");
  }

  return {
    message: "User deleted successfully",
  };
};