const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: false,
    },

    patientName: {
      type: String,
      trim: true,
    },

    ipOpNo: {
      type: String,
      trim: true,
      required: true,
    },

    phone: {
      type: String,
      trim: true,
      required: true,
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

module.exports = mongoose.model("Report", reportSchema);