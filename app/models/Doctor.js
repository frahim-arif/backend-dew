const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    specialist: { type: String, required: true, trim: true },
    qualification: { type: String, trim: true },
    experience: { type: String, trim: true },
    department: { type: String, trim: true },

    // OPD Schedule
    opdStartTime: {
      type: String,
      trim: true,
    },

    opdEndTime: {
      type: String,
      trim: true,
    },

    opdDays: {
      type: [String],
      default: [],
    },

    slotDuration: {
      type: Number,
      default: 15,
    },

    maxPatientsPerDay: {
      type: Number,
      default: 30,
    },

    image: {
      type: String,
      trim: true,
    },

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