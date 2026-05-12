// =======================================================
// FORCE IPV4 (FIX GMAIL SMTP IPV6 ISSUE)
// =======================================================

require("dns").setDefaultResultOrder("ipv4first");

require("dotenv").config();

const mongoose = require("mongoose");
const http = require("http");
const app = require("./app");

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