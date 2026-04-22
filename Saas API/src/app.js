const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

const app = express();

// =======================================================
// 🌐 TRUST PROXY (IMPORTANT FOR DEPLOYMENT)
// =======================================================
app.set("trust proxy", 1);

// =======================================================
// 🔐 SECURITY
// =======================================================
app.use(helmet());

// =======================================================
// 🌍 CORS CONFIG
// =======================================================
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// =======================================================
// 📦 BODY PARSER
// =======================================================
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true }));

// =======================================================
// 🔍 DEV LOGGER
// =======================================================
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`➡️ ${req.method} ${req.originalUrl}`);
    next();
  });

  app.use(morgan("dev"));
}

// =======================================================
// ⚡ PERFORMANCE
// =======================================================
app.use(compression());

// =======================================================
// 🚨 RATE LIMITERS
// =======================================================

// 🔐 LOGIN LIMIT
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
});

// ⚡ GENERAL API LIMIT
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 10000 : 300,
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
});

// =======================================================
// ❤️ HEALTH CHECK
// =======================================================
app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    message: "🚀 ReadyTech API Running",
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
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
const marketingRoutes = require("./modules/marketing/marketing.routes");
const automationRoutes = require("./modules/automation/automation.routes");

// =======================================================
// 🔐 AUTH ROUTES
// =======================================================
app.use("/api/v1/auth/login", loginLimiter);
app.use("/api/v1/auth", authRoutes);

// =======================================================
// 🚀 LIMITER WRAPPER
// =======================================================
const applyLimiter = (route) =>
  process.env.NODE_ENV === "production"
    ? [apiLimiter, route]
    : route;

// =======================================================
// 🚀 MAIN MODULE ROUTES (SaaS CORE)
// =======================================================
app.use("/api/v1/users", applyLimiter(userRoutes));
app.use("/api/v1/company", applyLimiter(companyRoutes));
app.use("/api/v1/leads", applyLimiter(leadRoutes));
app.use("/api/v1/crm", applyLimiter(crmRoutes));
app.use("/api/v1/marketing", applyLimiter(marketingRoutes));

// ✅ FIXED HERE
app.use("/api/v1/automation", applyLimiter(automationRoutes));

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
  console.error("🔥 ERROR:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
});

module.exports = app;