const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const timelineRoutes = require("./routes/timelineRoutes");
const programRoutes = require("./routes/programRoutes");
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
app.use("/api/programs", programRoutes);

// Health checking route
app.get("/", (req, res) => {
  console.log("Timeline Server is running...");
  res.status(200).send("OK");
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
