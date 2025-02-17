const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const timelineRoutes = require("./routes/timelineRoutes");
const errorHandler = require("./middlewares/errorHandler");
const seedAdmin = require("./seeder/adminSeeder");
const env = require("./config/env");

const app = express();

// Middleware
app.use(
  cors({
    origin: env.client.url,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
    ],
  })
);
app.use(express.json());
app.use(cookieParser());

// Database Connection & Seed Admin User
const initializeApp = async () => {
  try {
    await connectDB();
    await seedAdmin();
  } catch (error) {
    console.error("❌ Error initializing app:", error);
  }
};

initializeApp();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/timelines", timelineRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
