const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../user/user.model");
const Company = require("../company/company.model");
const crypto = require("crypto");

/* ================= ERROR CLASS ================= */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

/* ================= TOKEN GENERATOR (FIXED) ================= */
const generateTokens = (user) => {
  if (!user?.tenantId) {
    throw new AppError("Tenant missing in user - cannot generate token", 500);
  }

  const payload = {
    id: user._id.toString(),
    tenantId: user.tenantId.toString(), // 🔥 FORCE STRING SAFETY
    role: user.role,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  const refreshToken = jwt.sign(
    {
      id: user._id.toString(),
      tenantId: user.tenantId.toString(), // 🔥 ADD FOR CONSISTENCY
      ver: crypto.randomUUID(),
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

/* ================= SAFE USER ================= */
const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : user;

  delete obj.password;
  delete obj.refreshToken;
  delete obj.__v;

  return obj;
};

/* ================= REGISTER ================= */
exports.register = async (data) => {
  const { name, email, password, companyName } = data;

  const cleanEmail = email.toLowerCase().trim();

  const exists = await User.findOne({ email: cleanEmail });
  if (exists) throw new AppError("Email already exists", 400);

  const tenantId = "RTS-" + crypto.randomBytes(3).toString("hex");

  const company = await Company.create({
    name: companyName,
    tenantId,
  });

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: cleanEmail,
    password: hashed,
    role: "admin",
    tenantId, // 🔥 GUARANTEED HERE
  });

  const tokens = generateTokens(user);

  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    user: sanitizeUser(user),
    company,
    accessToken: tokens.accessToken,
  };
};

/* ================= LOGIN (FIXED SAFETY) ================= */
exports.login = async ({ email, password }) => {
  const cleanEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: cleanEmail }).select("+password");

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  if (!user.tenantId) {
    throw new AppError("User not assigned to tenant", 400);
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw new AppError("Invalid credentials", 401);
  }

  const tokens = generateTokens(user);

  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    user: sanitizeUser(user),
    accessToken: tokens.accessToken,
  };
};