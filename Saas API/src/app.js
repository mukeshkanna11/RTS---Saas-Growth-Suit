// =======================================================
// src/app.js
// FULL UPDATED PRODUCTION-LEVEL EXPRESS APP
// =======================================================

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

const app = express();

// =======================================================
// 🌐 TRUST PROXY
// =======================================================
app.set("trust proxy", 1);

// =======================================================
// 🔐 SECURITY
// =======================================================
app.use(helmet());

// =======================================================
// 🌍 CORS CONFIG
// =======================================================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://readytechsaas.netlify.app",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// =======================================================
// 📦 BODY PARSERS
// =======================================================
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true }));

// =======================================================
// ⚡ PERFORMANCE
// =======================================================
app.use(compression());

// =======================================================
// 🔍 LOGGER (DEV ONLY)
// =======================================================
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));

  app.use((req, res, next) => {
    console.log(`➡️ ${req.method} ${req.originalUrl}`);
    next();
  });
}

// =======================================================
// 🚨 RATE LIMITERS
// =======================================================
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

const routeWithLimiter =
  process.env.NODE_ENV === "production" ? [apiLimiter] : [];

// =======================================================
// 🚀 ROUTE IMPORTS
// =======================================================
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/user/user.routes");
const companyRoutes = require("./modules/company/company.routes");
const leadRoutes = require("./modules/leads/lead.routes");
const crmRoutes = require("./modules/crm/crm.routes");
const marketingRoutes = require("./modules/marketing/marketing.routes");
const automationRoutes = require("./modules/automation/automation.routes");
const analyticsRoutes = require("./modules/analytics/analytics.routes");
const subscriptionRoutes = require("./modules/subscription/subscription.routes");

// =======================================================
// 🌍 ROOT ROUTE
// =======================================================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ReadyTech SaaS API is live 🚀",
    version: "1.0.0",
    health: "/api/v1/health",
    docs: "/api/v1/test",
  });
});

// =======================================================
// ❤️ HEALTH CHECK
// =======================================================
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ReadyTech API Running",
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    timestamp: new Date(),
  });
});

// =======================================================
// 🧪 TEST ROUTE
// =======================================================
app.get("/api/v1/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API working successfully",
  });
});

// =======================================================
// 🔐 AUTH ROUTES
// =======================================================
app.use("/api/v1/auth/login", loginLimiter);
app.use("/api/v1/auth", authRoutes);

// =======================================================
// 🚀 MAIN MODULE ROUTES
// =======================================================
app.use("/api/v1/users", ...routeWithLimiter, userRoutes);
app.use("/api/v1/company", ...routeWithLimiter, companyRoutes);
app.use("/api/v1/leads", ...routeWithLimiter, leadRoutes);
app.use("/api/v1/crm", ...routeWithLimiter, crmRoutes);
app.use("/api/v1/marketing", ...routeWithLimiter, marketingRoutes);
app.use("/api/v1/automation", ...routeWithLimiter, automationRoutes);
app.use("/api/v1/analytics", ...routeWithLimiter, analyticsRoutes);
app.use("/api/v1/subscription", ...routeWithLimiter, subscriptionRoutes);

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
    ...(process.env.NODE_ENV !== "production" && {
      stack: err.stack,
    }),
  });
});

module.exports = app;