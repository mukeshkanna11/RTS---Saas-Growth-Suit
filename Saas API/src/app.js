// =======================================================
// src/app.js
// PRODUCTION GRADE EXPRESS APP (UPDATED)
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
// TRUST PROXY (Render / Nginx / Heroku safe)
// =======================================================
app.set("trust proxy", 1);

// =======================================================
// SECURITY HEADERS (HARDENED)
// =======================================================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// =======================================================
// CORS (PRODUCTION SAFE)
// =======================================================
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:3000",
  "https://readytechsaas.netlify.app",
  process.env.CLIENT_URL,
]);

const corsOptions = {
  origin: (origin, callback) => {
    // allow server-to-server / mobile apps
    if (!origin) return callback(null, true);

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    console.warn("❌ Blocked CORS origin:", origin);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// =======================================================
// BODY PARSER
// =======================================================
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true }));

// =======================================================
// PERFORMANCE
// =======================================================
app.use(compression());

// =======================================================
// LOGGING
// =======================================================
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined")); // production logs (important)
}

// =======================================================
// RATE LIMITING (SAFE CONFIG)
// =======================================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // safe production value
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
});

// apply globally (safe)
app.use(apiLimiter);

// =======================================================
// ROUTES
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

// ROOT
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ReadyTech SaaS API is running 🚀",
  });
});

// HEALTH
app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    timestamp: new Date(),
  });
});

// AUTH
app.use("/api/v1/auth/login", loginLimiter);
app.use("/api/v1/auth", authRoutes);

// MODULES
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
  console.error("🔥 ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;