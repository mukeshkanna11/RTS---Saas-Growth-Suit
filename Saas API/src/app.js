const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

const app = express();

// -------------------------------
// 🌐 TRUST PROXY (IMPORTANT FOR DEPLOYMENT)
// -------------------------------
app.set("trust proxy", 1);

// -------------------------------
// 🔐 SECURITY HEADERS
// -------------------------------
app.use(helmet());

// -------------------------------
// 🌍 CORS CONFIG
// -------------------------------
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// -------------------------------
// 📦 BODY PARSER
// -------------------------------
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// -------------------------------
// 🧾 LOGGER (DEV ONLY)
// -------------------------------
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// -------------------------------
// ⚡ COMPRESSION
// -------------------------------
app.use(compression());

// =======================================================
// 🚨 RATE LIMITERS (FIXED v7+)
// =======================================================

// 🔐 LOGIN LIMITER (strict protection)
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // login attempts

  keyGenerator: ipKeyGenerator, // ✅ FIX FOR IPv6

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

// ⚡ GENERAL API LIMITER
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: process.env.NODE_ENV === "development" ? 10000 : 300,

  keyGenerator: ipKeyGenerator, // ✅ FIX

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests, slow down.",
  },
});

// =======================================================
// 🧠 HEALTH CHECK
// =======================================================
app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    message: "🚀 ReadyTech API Running",
    uptime: process.uptime(),
  });
});

// =======================================================
// 📌 ROUTES IMPORT
// =======================================================
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/user/user.routes");
const companyRoutes = require("./modules/company/company.routes");
const leadRoutes = require("./modules/leads/lead.routes");
const crmRoutes = require("./modules/crm/crm.routes");

// =======================================================
// 🚀 ROUTES SETUP
// =======================================================

// 🔐 AUTH (apply limiter ONLY on login)
app.use("/api/v1/auth/login", loginLimiter);
app.use("/api/v1/auth", authRoutes);

// 🚀 OTHER ROUTES
if (process.env.NODE_ENV === "production") {
  app.use("/api/v1/users", apiLimiter, userRoutes);
  app.use("/api/v1/company", apiLimiter, companyRoutes);
  app.use("/api/v1/leads", apiLimiter, leadRoutes);
  app.use("/api/v1/crm", apiLimiter, crmRoutes);
} else {
  // 🔥 NO LIMITS IN DEV (prevents your 429 issue)
  app.use("/api/v1/users", userRoutes);
  app.use("/api/v1/company", companyRoutes);
  app.use("/api/v1/leads", leadRoutes);
  app.use("/api/v1/crm", crmRoutes);
}

// =======================================================
// 🧪 TEST ROUTE
// =======================================================
app.get("/api/v1/test", (req, res) => {
  res.json({
    success: true,
    message: "API working ✅",
  });
});

// =======================================================
// ❌ 404 HANDLER
// =======================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// =======================================================
// ❌ GLOBAL ERROR HANDLER
// =======================================================
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
});

module.exports = app;