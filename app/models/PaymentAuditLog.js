
const mongoose = require("mongoose");

const paymentAuditLogSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      index: true,
    },

    event: {
      type: String,
      required: true,
      index: true,
    },

    razorpayOrderId: {
      type: String,
      default: "",
      index: true,
    },

    razorpayPaymentId: {
      type: String,
      default: "",
      index: true,
    },

    amountPaise: {
      type: Number,
      default: null,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: [
        "REQUESTED",
        "SUCCESS",
        "FAILED",
        "DB_SAVED",
        "VERIFIED",
        "REJECTED",
      ],
      default: "REQUESTED",
    },

    request: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    response: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    verification: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    error: {
      type: String,
      default: "",
    },

    source: {
      type: String,
      default: "Dew Care Hospital API",
    },
  },
  {
    timestamps: true,
  }
);

paymentAuditLogSchema.index({
  appointmentId: 1,
  createdAt: -1,
});

paymentAuditLogSchema.index({
  razorpayOrderId: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "PaymentAuditLog",
  paymentAuditLogSchema
);
