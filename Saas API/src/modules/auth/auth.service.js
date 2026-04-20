const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../user/user.model");
const Company = require("../company/company.model");

// --------------------------------------
// ✅ CUSTOM ERROR CLASS (IMPORTANT)
// --------------------------------------
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// --------------------------------------
// 🔥 GENERATE TENANT ID
// --------------------------------------
const generateTenantId = async () => {
  const count = await Company.countDocuments();
  return "RTS" + String(count + 1).padStart(3, "0");
};

// --------------------------------------
// 🔥 GENERATE SLUG
// --------------------------------------
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
};

// --------------------------------------
// 🔐 GENERATE TOKENS
// --------------------------------------
const generateTokens = (user) => {
  const payload = {
    id: user._id,
    tenantId: user.tenantId,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

// --------------------------------------
// 📝 REGISTER
// --------------------------------------
exports.register = async (data) => {
  const { name, email, password, companyName } = data;

  const cleanEmail = email.toLowerCase().trim();

  // 🔥 Check global duplicate email
  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser) {
    throw new AppError("Email already registered", 400);
  }

  const tenantId = await generateTenantId();
  const slug = generateSlug(companyName + "-" + Date.now());

  const company = await Company.create({
    name: companyName,
    tenantId,
    slug,
  });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: cleanEmail,
    password: hashedPassword,
    role: "admin",
    tenantId,
  });

  const tokens = generateTokens(user);

  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    user,
    company,
    ...tokens,
  };
};

// --------------------------------------
// 👤 CREATE USER (ADMIN)
// --------------------------------------
exports.createUser = async (data, tenantId) => {
  const { name, email, password, role } = data;

  const cleanEmail = email.toLowerCase().trim();

  if (role === "admin") {
    throw new AppError("Cannot create admin user", 403);
  }

  const existingUser = await User.findOne({
    email: cleanEmail,
    tenantId,
  });

  if (existingUser) {
    throw new AppError("User already exists in this company", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: cleanEmail,
    password: hashedPassword,
    role,
    tenantId,
  });

  return user;
};

// --------------------------------------
// 🔐 LOGIN
// --------------------------------------
exports.login = async ({ email, password }) => {
  const cleanEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: cleanEmail }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  const tokens = generateTokens(user);

  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    user,
    ...tokens,
  };
};


// --------------------------------------
// 🚪 LOGOUT
// --------------------------------------
exports.logout = async (userId) => {
  if (!userId) {
    throw new AppError("User ID required", 400);
  }

  await User.findByIdAndUpdate(userId, {
    refreshToken: null,
  });

  return true;
};