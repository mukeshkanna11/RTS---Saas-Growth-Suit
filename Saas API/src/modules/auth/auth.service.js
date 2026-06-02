const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../user/user.model");
const Company = require("../company/company.model");

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

/* =========================================
   TOKEN GENERATION
========================================= */
const generateTokens = (user) => {
  const payload = {
    id: user._id.toString(),
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  const refreshToken = jwt.sign(
    {
      id: user._id.toString(),
      ver: crypto.randomUUID(),
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return { token, refreshToken };
};

/* =========================================
   SANITIZE USER
========================================= */
const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : user;

  delete obj.password;
  delete obj.refreshToken;

  return obj;
};

/* =========================================
   REGISTER COMPANY + ADMIN
========================================= */
exports.register = async (data) => {
  const { name, email, password, companyName } = data;

  if (!name || !email || !password || !companyName) {
    throw new AppError("All fields are required", 400);
  }

  const cleanEmail = email.toLowerCase().trim();

  const exists = await User.findOne({
    email: cleanEmail,
    isDeleted: false,
  });

  if (exists) {
    throw new AppError("Email already exists", 400);
  }

  // 🔥 Generate Tenant ID
  const tenantId = "RTS-" + crypto.randomBytes(3).toString("hex");

  // 🔥 Create Company
  const company = await Company.create({
    name: companyName,
    tenantId,
  });

  // 🔥 Hash Password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 🔥 Create Admin User
  const user = await User.create({
    name,
    email: cleanEmail,
    password: hashedPassword,
    role: "admin",
    tenantId,
  });

  // 🔥 Generate Tokens
  const tokens = generateTokens(user);

  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    user: sanitizeUser(user),
    company,
    token: tokens.token,
    refreshToken: tokens.refreshToken,
  };
};

/* =========================================
   LOGIN
========================================= */
exports.login = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const cleanEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    email: cleanEmail,
    isDeleted: false,
  }).select("+password");

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  // 🔥 Block inactive users
  if (!user.isActive) {
    throw new AppError("Account is inactive", 403);
  }

  // 🔥 Compare Password
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw new AppError("Invalid credentials", 401);
  }

  // 🔥 Generate Tokens
  const tokens = generateTokens(user);

  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    user: sanitizeUser(user),
    token: tokens.token,
    refreshToken: tokens.refreshToken,
  };
};

/* =========================================
   LOGOUT
========================================= */
exports.logout = async (userId) => {
  const user = await User.findById(userId);

  if (!user || user.isDeleted) {
    throw new AppError("User not found", 404);
  }

  user.refreshToken = null;

  await user.save();

  return true;
};