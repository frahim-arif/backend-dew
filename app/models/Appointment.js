const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    age: {
      type: String,
      trim: true,
    },

    gender: {
      type: String,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: String,
      required: true,
      trim: true,
    },

    doctor: {
      type: String,
      required: true,
      trim: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    message: {
      type: String,
      trim: true,
    },

    // Appointment Status
    status: {
      type: String,
      enum: [
        "Pending Payment",
        "Pending",
        "Confirmed",
        "Cancelled",
        "Completed",
      ],
      default: "Pending Payment",
    },

    // Payment Status
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    // Appointment Fee
    paymentAmount: {
      type: Number,
      default: 500,
    },

    // Razorpay Order ID
    razorpayOrderId: {
      type: String,
      default: "",
      index: true,
    },

    // Razorpay Payment ID
    razorpayPaymentId: {
      type: String,
      default: "",
      index: true,
    },

    // Razorpay Signature
    razorpaySignature: {
      type: String,
      default: "",
    },

    // Payment Time
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Appointment", appointmentSchema);