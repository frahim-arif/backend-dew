
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  getPaymentAudits,
  getPaymentAuditDetails,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/payment-audits", authMiddleware, getPaymentAudits);

router.get(
  "/payment-audits/:appointmentId/logs",
  authMiddleware,
  getPaymentAuditDetails
);

module.exports = router;
