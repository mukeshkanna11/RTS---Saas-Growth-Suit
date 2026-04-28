// =======================================================
// src/app.js
// FULL UPDATED SAAS-LEVEL EXPRESS APP (CORS FIXED)
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
// 🔐 SECURITY MIDDLEWARE
// =======================================================
app.use(helmet());

// =======================================================
// 🌍 CORS CONFIG (FIXED)
// =======================================================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://readytechsaas.netlify.app",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server / postman / no-origin requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight requests
app.options("*", cors());

// =======================================================
// 📦 BODY PARSER
// =======================================================
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true }));

// =======================================================
// 🔍 DEV LOGGER
// =======================================================
if (process.env.NODE_ENV !== "production") {
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
// ❤️ HEALTH CHECK
// =======================================================
app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    message: "ReadyTech API Running",
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    timestamp: new Date(),
  });
});

// =======================================================
// 🔐 AUTH ROUTES
// =======================================================
app.use("/api/v1/auth/login", loginLimiter);
app.use("/api/v1/auth", authRoutes);

// =======================================================
// 🚀 LIMITER HELPER
// =======================================================
const applyLimiter = (route) =>
  process.env.NODE_ENV === "production"
    ? [apiLimiter, route]
    : route;

// =======================================================
// 🚀 MAIN MODULE ROUTES
// =======================================================
app.use("/api/v1/users", applyLimiter(userRoutes));
app.use("/api/v1/company", applyLimiter(companyRoutes));
app.use("/api/v1/leads", applyLimiter(leadRoutes));
app.use("/api/v1/crm", applyLimiter(crmRoutes));
app.use("/api/v1/marketing", applyLimiter(marketingRoutes));
app.use("/api/v1/automation", applyLimiter(automationRoutes));
app.use("/api/v1/analytics", applyLimiter(analyticsRoutes));
app.use("/api/v1/subscription", applyLimiter(subscriptionRoutes));

// =======================================================
// 🧪 TEST ROUTE
// =======================================================
app.get("/api/v1/test", (req, res) => {
  res.json({
    success: true,
    message: "API working successfully",
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
    ...(process.env.NODE_ENV !== "production" && {
      stack: err.stack,
    }),
  });
});

module.exports = app;