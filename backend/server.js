const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const guiderRoutes = require("./routes/guiderRoutes");
const studentRoutes = require("./routes/studentRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const aiRoutes = require("./routes/aiRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/guider", guiderRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/ai", aiRoutes);

const PORT = process.env.PORT || 5000;

async function startServer() {
  if (!process.env.MONGO_URI) {
    console.error("Missing MONGO_URI in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully ✅");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("DB Connection Error:", err.message);
    process.exit(1);
  }
}

const requestRoutes = require("./routes/requestRoutes");
app.use("/api/request", requestRoutes);

startServer();
