// =======================================================
// src/app.js
// PRODUCTION-GRADE SAAS EXPRESS APP (FINAL FIXED VERSION)
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
// TRUST PROXY (RENDER / VERCEL / NETLIFY SAFE)
// =======================================================
app.set("trust proxy", 1);

// =======================================================
// SECURITY HEADERS
// =======================================================
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// =======================================================
// BODY PARSER
// =======================================================
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true }));

// =======================================================
// COMPRESSION (PERFORMANCE)
// =======================================================
app.use(compression());

// =======================================================
// LOGGING
// =======================================================
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
);

// =======================================================
// CORS - FULLY FIXED FOR ALL DEVICES
// =======================================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",

  // Production Frontends
  "https://readytech-growth-suit.vercel.app",
  "https://readytechsaas.netlify.app",

  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // allow mobile apps / postman / server-to-server
    if (!origin) return callback(null, true);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      origin.endsWith(".netlify.app");

    if (isAllowed) {
      return callback(null, true);
    }

    console.log("❌ CORS BLOCKED:", origin);
    return callback(new Error("CORS not allowed"));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Origin",
    "Accept",
    "X-Requested-With",
  ],
};

app.use(cors(corsOptions));

// =======================================================
// IMPORTANT: HANDLE PRE-FLIGHT REQUESTS
// =======================================================
app.options("*", cors(corsOptions));

// =======================================================
// DISABLE HEADER LEAK (SECURITY)
// =======================================================
app.disable("x-powered-by");

// =======================================================
// RATE LIMITERS
// =======================================================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 200,
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply global limiter
app.use(apiLimiter);

// =======================================================
// ROUTES IMPORT
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
// ROOT ROUTE
// =======================================================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ReadyTech SaaS API Running 🚀",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// =======================================================
// HEALTH CHECK (IMPORTANT FOR FRONTEND)
// =======================================================
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    uptime: process.uptime(),
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// =======================================================
// AUTH ROUTES (FIX LOGIN LIMITER PROPERLY)
// =======================================================
app.use("/api/v1/auth", authRoutes);

// IMPORTANT: apply limiter inside route file OR here safely
app.use("/api/v1/auth/login", loginLimiter);

// =======================================================
// MODULE ROUTES
// =======================================================
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/company", companyRoutes);
app.use("/api/v1/leads", leadRoutes);
app.use("/api/v1/crm", crmRoutes);
app.use("/api/v1/marketing", marketingRoutes);
app.use("/api/v1/automation", automationRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/subscription", subscriptionRoutes);

// =======================================================
// 404 HANDLER
// =======================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

// =======================================================
// GLOBAL ERROR HANDLER
// =======================================================
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err.message);

  if (err.message === "CORS not allowed") {
    return res.status(403).json({
      success: false,
      message: "CORS blocked this request",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// =======================================================
// EXPORT
// =======================================================
module.exports = app;