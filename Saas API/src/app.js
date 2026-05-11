// =======================================================
// src/app.js
// PRODUCTION-GRADE SAAS EXPRESS APP
// FINAL STABLE VERSION (VERCEL + RENDER + MOBILE SAFE)
// =======================================================

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const { ipKeyGenerator } = require("express-rate-limit");

const app = express();

// =======================================================
// TRUST PROXY (RENDER / VERCEL SAFE)
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
// DISABLE X-POWERED-BY
// =======================================================
app.disable("x-powered-by");

// =======================================================
// BODY PARSER
// =======================================================
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true }));

// =======================================================
// COOKIE PARSER
// =======================================================
app.use(cookieParser());

// =======================================================
// COMPRESSION
// =======================================================
app.use(compression());

// =======================================================
// LOGGER
// =======================================================
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
);

// =======================================================
// CORS CONFIGURATION
// =======================================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",

  // Production Frontend
  "https://readytech-growth-suit.vercel.app",
  "https://readytechsaas.netlify.app",

  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without origin
    // (mobile apps, postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ BLOCKED BY CORS:", origin);

    return callback(
      new Error(`CORS not allowed for origin: ${origin}`)
    );
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
    "Content-Type",
    "Authorization",
    "Origin",
    "Accept",
    "X-Requested-With",
  ],
};

app.use(cors(corsOptions));

// =======================================================
// HANDLE PREFLIGHT
// =======================================================
app.options("*", cors(corsOptions));

// =======================================================
// RATE LIMITERS
// =======================================================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins

  max: Number(process.env.RATE_LIMIT_MAX) || 200,

  keyGenerator: (req) => {
    return ipKeyGenerator(req);
  },

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins

  max: 5,

  keyGenerator: (req) => {
    return ipKeyGenerator(req);
  },

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many login attempts. Please try later.",
  },
});

// =======================================================
// APPLY GLOBAL LIMITER
// =======================================================
app.use("/api", apiLimiter);

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
// HEALTH CHECK
// =======================================================
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// =======================================================
// AUTH ROUTES
// =======================================================

// Apply login limiter BEFORE auth routes
app.use("/api/v1/auth/login", loginLimiter);

app.use("/api/v1/auth", authRoutes);

// =======================================================
// API ROUTES
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
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

// =======================================================
// GLOBAL ERROR HANDLER
// =======================================================
app.use((err, req, res, next) => {
  console.error("🔥 SERVER ERROR:", err);

  // CORS ERROR
  if (err.message?.includes("CORS")) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  // JWT ERROR
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  // JWT EXPIRED
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  // MONGOOSE BAD OBJECT ID
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid resource ID",
    });
  }

  // MONGOOSE VALIDATION ERROR
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors)
        .map((val) => val.message)
        .join(", "),
    });
  }

  // DEFAULT ERROR
  return res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});

// =======================================================
// EXPORT APP
// =======================================================
module.exports = app;