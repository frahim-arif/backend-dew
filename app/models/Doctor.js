const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    // ==================================================
    // BASIC INFORMATION
    // ==================================================
    name: {
      type: String,
      required: true,
      trim: true,
    },

    specialist: {
      type: String,
      required: true,
      trim: true,
    },

    qualification: {
      type: String,
      trim: true,
      default: "",
    },

    experience: {
      type: String,
      trim: true,
      default: "",
    },

    department: {
      type: String,
      trim: true,
      default: "",
    },

    // ==================================================
    // OPD AVAILABILITY
    // ==================================================

    // Doctor provides OPD service or not
    opdAvailable: {
      type: Boolean,
      default: true,
    },

    // Doctor treats indoor patients or not
    indoorDoctor: {
      type: Boolean,
      default: false,
    },

    // ==================================================
    // DOCTOR FEES
    // ==================================================

    // Individual OPD consultation fee
    opdFee: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Individual Indoor consultation/visit fee
    indoorFee: {
      type: Number,
      min: 0,
      default: 0,
    },

    // ==================================================
    // OPD SCHEDULE
    // ==================================================

    opdStartTime: {
      type: String,
      trim: true,
      default: "",
    },

    opdEndTime: {
      type: String,
      trim: true,
      default: "",
    },

    opdDays: {
      type: [String],
      default: [],
    },

    // Minimum appointment slot in minutes
    slotDuration: {
      type: Number,
      min: 1,
      default: 15,
    },

    // Maximum OPD patients allowed per day
    maxPatientsPerDay: {
      type: Number,
      min: 1,
      default: 30,
    },

    // ==================================================
    // DOCTOR IMAGE
    // ==================================================

    image: {
      type: String,
      trim: true,
      default: "",
    },

    // ==================================================
    // DOCTOR STATUS
    // ==================================================

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Doctor", doctorSchema);