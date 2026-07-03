// =======================================================
// FORCE IPV4 (FIX GMAIL SMTP IPV6 ISSUE)
// =======================================================

require("dns").setDefaultResultOrder("ipv4first");

// Explicit path ensures .env loads correctly regardless of where `node` is invoked from
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const http = require("http");
const app = require("./app");
const { startRenewalJob } = require("./jobs/renewalJob");

const PORT = process.env.PORT || 5000;

// =======================================================
// GLOBAL ERROR HANDLERS (REGISTER EARLY)
// =======================================================
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.message);
  process.exit(1);
});

// =======================================================
// DATABASE CONNECTION
// =======================================================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ DB Connection Failed:", error.message);

    process.exit(1);
  }
};

// =======================================================
// START SERVER
// =======================================================
const startServer = async () => {
  await connectDB();

  // PayPal credential check — logged by paypal.service at require() time.
  // Re-confirm here so the startup summary is visible in sequence with other boot messages.
  try {
    const paypalService = require("./services/paypal.service");
    const cfg = paypalService.getConfigStatus();
    if (!cfg.configured) {
      console.warn(
        `[Server] PayPal NOT configured — payment routes will return 503.\n` +
        `         Add PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET to .env and restart.`
      );
    } else {
      console.log(
        `[Server] PayPal ready — mode=${cfg.mode} | clientId=${cfg.clientIdPrefix} | currency=${cfg.currency}`
      );
    }
  } catch (err) {
    console.error("[Server] paypal.service failed to load:", err.message);
  }

  // Start background jobs (non-fatal — app runs even if Redis is unavailable)
  await startRenewalJob();

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(
      `🚀 Server running on port ${PORT} in ${
        process.env.NODE_ENV || "development"
      } mode`
    );
  });

  // =======================================================
  // HANDLE PROMISE REJECTIONS
  // =======================================================

  process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Rejection:", err.message);

    server.close(() => {
      process.exit(1);
    });
  });

  // =======================================================
  // GRACEFUL SHUTDOWN
  // =======================================================

  const shutdown = (signal) => {
    console.log(`🛑 ${signal} received. Shutting down gracefully...`);

    server.close(() => {
      console.log("💤 Server closed");

      mongoose.connection.close(false, () => {
        console.log("📦 MongoDB connection closed");

        process.exit(0);
      });
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

startServer();