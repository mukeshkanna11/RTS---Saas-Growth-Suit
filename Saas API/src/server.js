// src/server.js
require("dotenv").config();

const mongoose = require("mongoose");
const http = require("http");
const app = require("./app");

const PORT = process.env.PORT || 5000;

// -------------------------------
// 🗄️ DATABASE CONNECTION
// -------------------------------
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // optional configs (modern mongoose doesn't need much)
    });

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ DB Connection Failed:", error.message);
    process.exit(1);
  }
};

// -------------------------------
// 🚀 START SERVER
// -------------------------------
const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  // -------------------------------
  // 🔥 HANDLE UNHANDLED ERRORS
  // -------------------------------
  process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Rejection:", err.message);
    server.close(() => process.exit(1));
  });

  process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err.message);
    process.exit(1);
  });

  // -------------------------------
  // 🛑 GRACEFUL SHUTDOWN
  // -------------------------------
  process.on("SIGINT", () => {
    console.log("🛑 Server shutting down...");
    server.close(() => {
      console.log("💤 Process terminated");
      process.exit(0);
    });
  });
};

startServer();