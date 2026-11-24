
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  getPaymentAudits,
  getPaymentAuditDetails,
} = require("../controllers/adminController");

const {
  getJobApplications,
  updateJobApplicationStatus,
} = require("../controllers/jobApplicationController");

const router = express.Router();

// Payment Audits
router.get("/payment-audits", authMiddleware, getPaymentAudits);

router.get(
  "/payment-audits/:appointmentId/logs",
  authMiddleware,
  getPaymentAuditDetails
);

// Job Applications
router.get(
  "/job-applications",
  authMiddleware,
  getJobApplications
);

router.patch(
  "/job-applications/:id/status",
  authMiddleware,
  updateJobApplicationStatus
);

module.exports = router;
