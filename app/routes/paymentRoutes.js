const express = require("express");

const {
  createAppointmentOrder,
  verifyAppointmentPayment,
  markAppointmentPaymentFailed,
} = require("../controllers/paymentController");

const router = express.Router();

router.post(
  "/create-order",
  createAppointmentOrder
);

router.post(
  "/verify",
  verifyAppointmentPayment
);

router.post(
  "/failed",
  markAppointmentPaymentFailed
);

module.exports = router;