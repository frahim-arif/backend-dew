
const express = require("express");

const {
  createAppointmentOrder,
  verifyAppointmentPayment,
  markAppointmentPaymentFailed,
  hostedCheckoutCallback,
  hostedCheckoutCancel,
} = require("../controllers/paymentController");

const router = express.Router();

// Create Razorpay order
router.post(
  "/create-order",
  createAppointmentOrder
);

// Existing verification route (backward compatibility)
router.post(
  "/verify",
  verifyAppointmentPayment
);

// Existing payment failure route
router.post(
  "/failed",
  markAppointmentPaymentFailed
);

// Razorpay Hosted Checkout callback
router.post(
  "/hosted-callback",
  hostedCheckoutCallback
);

// Razorpay Hosted Checkout cancel/back redirect
router.get(
  "/hosted-cancel",
  hostedCheckoutCancel
);

module.exports = router;
