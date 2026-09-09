const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },

    patientName: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    doctor: {
      type: String,
      trim: true,
    },

    file: {
      type: String,
      required: true,
      trim: true,
    },

    fileType: {
      type: String,
      enum: ["PDF", "IMAGE"],
      default: "PDF",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);