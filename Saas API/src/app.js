// =======================================================
// src/app.js
// PRODUCTION-GRADE SAAS EXPRESS APP
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
// TRUST PROXY (RENDER / NGINX / HEROKU SAFE)
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
// CORS (PRODUCTION SAFE)
// =======================================================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://readytechsaas.netlify.app",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow Postman / Mobile Apps / Server-to-server
    if (!origin) {
      return callback(null, true);
    }

    // Exact allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow all Netlify preview deployments
    if (origin.endsWith(".netlify.app")) {
      return callback(null, true);
    }

    console.error("❌ CORS BLOCKED:", origin);

    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],

  exposedHeaders: ["set-cookie"],

  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// =======================================================
// EXTRA CORS SAFETY
// =======================================================
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

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
  app.use(morgan("combined"));
}

// =======================================================
// RATE LIMITERS
// =======================================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
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
    message: "Too many login attempts. Please try again later.",
  },
});

// =======================================================
// APPLY GLOBAL API LIMITER
// =======================================================
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
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// =======================================================
// HEALTH CHECK
// =======================================================
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// =======================================================
// AUTH ROUTES
// =======================================================
app.use("/api/v1/auth/login", loginLimiter);
app.use("/api/v1/auth", authRoutes);

// =======================================================
// API MODULE ROUTES
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
  console.error("🔥 SERVER ERROR:");
  console.error(err);

  // CORS errors
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS policy blocked this request",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== "production" && {
      stack: err.stack,
    }),
  });
});

// =======================================================
// EXPORT APP
// =======================================================
module.exports = app;