
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  uploadReport,
  getReportsByIpOpAndPhone,
  getAllReports,
  getReportsByAppointment,
} = require("../controllers/reportController");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Upload Directory
|--------------------------------------------------------------------------
| Make sure uploads folder exists before multer tries to save a file.
|--------------------------------------------------------------------------
*/

const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

/*
|--------------------------------------------------------------------------
| Multer Storage
|--------------------------------------------------------------------------
*/

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const uniqueName =
      "report-" +
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      extension;

    cb(null, uniqueName);
  },
});

/*
|--------------------------------------------------------------------------
| Allowed File Types
|--------------------------------------------------------------------------
*/

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PDF, JPG, JPEG and PNG files are allowed"
      )
    );
  }
};

/*
|--------------------------------------------------------------------------
| Multer Upload Configuration
|--------------------------------------------------------------------------
*/

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

/*
|--------------------------------------------------------------------------
| Upload Report
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error("Report Multer Error:", err);

        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "Report file must be 10 MB or less.",
          });
        }

        return res.status(400).json({
          success: false,
          message: err.message || "File upload error.",
        });
      }

      if (err) {
        console.error("Report File Upload Error:", err);

        return res.status(400).json({
          success: false,
          message:
            err.message ||
            "Unable to upload report file.",
        });
      }

      next();
    });
  },
  uploadReport
);

/*
|--------------------------------------------------------------------------
| Get All Reports - Admin
|--------------------------------------------------------------------------
*/

router.get("/", getAllReports);

/*
|--------------------------------------------------------------------------
| Search Reports
| IP/OP No + Mobile
|--------------------------------------------------------------------------
*/

router.get(
  "/search",
  getReportsByIpOpAndPhone
);

/*
|--------------------------------------------------------------------------
| Get Reports By Appointment
|--------------------------------------------------------------------------
*/

router.get(
  "/appointment/:appointmentId",
  getReportsByAppointment
);

module.exports = router;

