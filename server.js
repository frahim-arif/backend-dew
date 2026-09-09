const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const connectDB = require("./config/db");
const { createDefaultAdmin } = require("./app/controllers/authController");

// Routes
const visitorRoutes = require("./app/routes/visitorRoutes");
const prescriptionRoutes = require("./app/routes/prescriptionRoutes");
const appointmentRoutes = require("./app/routes/appointmentRoutes");
const authRoutes = require("./app/routes/authRoutes");
const doctorRoutes = require("./app/routes/doctorRoutes");
const facilityRoutes = require("./app/routes/facilityRoutes");
const galleryRoutes = require("./app/routes/galleryRoutes");
const settingRoutes = require("./app/routes/settingRoutes");
const serviceRoutes = require("./app/routes/serviceRoutes");
const trainingCourseRoutes = require("./app/routes/trainingCourseRoutes");
const trainingApplicationRoutes = require("./app/routes/trainingApplicationRoutes");

// Razorpay Payment Routes
const paymentRoutes = require("./app/routes/paymentRoutes");

const app = express();

/* ==========================
   Middleware
========================== */

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/api/training/applications",
  trainingApplicationRoutes
);

/* ==========================
   Static Files
========================== */

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

/* ==========================
   Home Route
========================== */

app.get("/", (req, res) => {
  res.send("🏥 Dew Care Hospital Backend is Running...");
});

/* ==========================
   API Routes
========================== */

app.use("/api/auth", authRoutes);

app.use("/api/appointments", appointmentRoutes);

app.use("/api/payments", paymentRoutes); // Razorpay

app.use("/api/doctors", doctorRoutes);

app.use("/api/services", serviceRoutes);

app.use("/api/facilities", facilityRoutes);

app.use("/api/gallery", galleryRoutes);

app.use("/api/settings", settingRoutes);

app.use("/api/visitor", visitorRoutes);

app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/training/courses", trainingCourseRoutes);

/* ==========================
   404 Route
========================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found",
  });
});

/* ==========================
   Global Error Handler
========================== */

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* ==========================
   Start Server
========================== */

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    await createDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server Startup Error:", err);
    process.exit(1);
  }
};

startServer();