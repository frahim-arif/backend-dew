const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  uploadReport,
  getReportsByIpOpAndPhone,
  getAllReports,
  getReportsByAppointment,
} = require("../controllers/reportController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      "report-" + Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, JPG and PNG files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});


// Upload Report
router.post("/", upload.single("file"), uploadReport);


// Get all reports - Admin
router.get("/", getAllReports);


// Search using IP/OP No + Mobile
router.get("/search", getReportsByIpOpAndPhone);


// Get reports by appointment
router.get("/appointment/:appointmentId", getReportsByAppointment);


module.exports = router;