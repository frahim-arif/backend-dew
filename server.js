// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const path = require("path");

// dotenv.config();

// const connectDB = require("./config/db");
// const { createDefaultAdmin } = require("./app/controllers/authController");

// // Routes
// const visitorRoutes = require("./app/routes/visitorRoutes");
// const prescriptionRoutes = require("./app/routes/prescriptionRoutes");
// const appointmentRoutes = require("./app/routes/appointmentRoutes");
// const authRoutes = require("./app/routes/authRoutes");
// const doctorRoutes = require("./app/routes/doctorRoutes");
// const facilityRoutes = require("./app/routes/facilityRoutes");
// const galleryRoutes = require("./app/routes/galleryRoutes");
// const settingRoutes = require("./app/routes/settingRoutes");
// const serviceRoutes = require("./app/routes/serviceRoutes");
// const trainingCourseRoutes = require("./app/routes/trainingCourseRoutes");
// const trainingApplicationRoutes = require("./app/routes/trainingApplicationRoutes");

// // Razorpay Payment Routes
// const paymentRoutes = require("./app/routes/paymentRoutes");

// const app = express();

// /* ==========================
//    Middleware
// ========================== */

// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL || "*",
//     credentials: true,
//   })
// );


// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use(
//   "/api/training/applications",
//   trainingApplicationRoutes
// );

// /* ==========================
//    Static Files
// ========================== */

// app.use(
//   "/uploads",
//   express.static(path.join(__dirname, "uploads"))
// );

// /* ==========================
//    Home Route
// ========================== */

// app.get("/", (req, res) => {
//   res.send("🏥 Dew Care Hospital Backend is Running...");
// });

// /* ==========================
//    API Routes
// ========================== */

// app.use("/api/auth", authRoutes);

// app.use("/api/appointments", appointmentRoutes);

// app.use("/api/payments", paymentRoutes); // Razorpay

// app.use("/api/doctors", doctorRoutes);

// app.use("/api/services", serviceRoutes);

// app.use("/api/facilities", facilityRoutes);

// app.use("/api/gallery", galleryRoutes);

// app.use("/api/settings", settingRoutes);

// app.use("/api/visitor", visitorRoutes);

// app.use("/api/prescriptions", prescriptionRoutes);
// app.use("/api/training/courses", trainingCourseRoutes);

// /* ==========================
//    404 Route
// ========================== */

// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "API Route Not Found",
//   });
// });

// /* ==========================
//    Global Error Handler
// ========================== */

// app.use((err, req, res, next) => {
//   console.error("Server Error:", err);

//   res.status(err.status || 500).json({
//     success: false,
//     message: err.message || "Internal Server Error",
//   });
// });

// /* ==========================
//    Start Server
// ========================== */

// const PORT = process.env.PORT || 5000;

// const startServer = async () => {
//   try {
//     await connectDB();

//     await createDefaultAdmin();

//     app.listen(PORT, () => {
//       console.log(`🚀 Server running on port ${PORT}`);
//     });
//   } catch (err) {
//     console.error("❌ Server Startup Error:", err);
//     process.exit(1);
//   }
// };

// startServer();


const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

// Database & Admin
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
const paymentRoutes = require("./app/routes/paymentRoutes");

// Create Express app
const app = express();

/* =========================================================
   Middleware
========================================================= */

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================================================
   Static Files
========================================================= */

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

/* =========================================================
   Home Route
========================================================= */

app.get("/", (req, res) => {
  res.status(200).send(
    "🏥 Dew Care Hospital Backend is Running..."
  );
});

/* =========================================================
   API Routes
========================================================= */

// Authentication
app.use("/api/auth", authRoutes);

// Appointments
app.use("/api/appointments", appointmentRoutes);

// Payments
app.use("/api/payments", paymentRoutes);

// Doctors
app.use("/api/doctors", doctorRoutes);

// Services
app.use("/api/services", serviceRoutes);

// Facilities
app.use("/api/facilities", facilityRoutes);

// Gallery
app.use("/api/gallery", galleryRoutes);

// Settings
app.use("/api/settings", settingRoutes);

// Visitor
app.use("/api/visitor", visitorRoutes);

// Prescriptions
app.use("/api/prescriptions", prescriptionRoutes);

// Training Courses
app.use("/api/training/courses", trainingCourseRoutes);

// Training Applications
app.use(
  "/api/training/applications",
  trainingApplicationRoutes
);

/* =========================================================
   404 Handler
========================================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found",
    path: req.originalUrl,
  });
});

/* =========================================================
   Global Error Handler
========================================================= */

app.use((err, req, res, next) => {
  console.error("❌ Server Error:");
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* =========================================================
   Start Server
========================================================= */

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("========================================");
    console.log("🔄 Starting Dew Care Hospital Backend");
    console.log("========================================");

    // Check important environment variables
    console.log(
      "MONGO_URI:",
      process.env.MONGO_URI ? "✅ Found" : "❌ Missing"
    );

    console.log(
      "RAZORPAY_KEY_ID:",
      process.env.RAZORPAY_KEY_ID ? "✅ Found" : "❌ Missing"
    );

    console.log(
      "RAZORPAY_KEY_SECRET:",
      process.env.RAZORPAY_KEY_SECRET
        ? "✅ Found"
        : "❌ Missing"
    );

    console.log("PORT:", PORT);

    console.log("----------------------------------------");

    // Connect MongoDB
    console.log("🔄 Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB Connected");

    // Create/check default admin
    console.log("🔄 Checking default admin...");
    await createDefaultAdmin();
    console.log("✅ Default admin check completed");

    // Start server
    app.listen(PORT, () => {
      console.log("========================================");
      console.log(`🚀 Server running on port ${PORT}`);
      console.log("========================================");
    });

  } catch (err) {
    console.error("========================================");
    console.error("❌ SERVER STARTUP ERROR");
    console.error("========================================");
    console.error("Message:", err.message);
    console.error("Name:", err.name);
    console.error("Stack:", err.stack);
    console.error("========================================");

    process.exit(1);
  }
};

// Start application
startServer();