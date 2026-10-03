const express = require("express");

const {
  getDoctorReports,
} = require("../controllers/reportsController");

const router = express.Router();

/* =========================================================
   DOCTOR REPORTS
   GET /api/reports/doctors
========================================================= */

router.get("/doctors", getDoctorReports);

module.exports = router;