const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    hospitalName: {
      type: String,
      default: "Dew Care Hospital",
      trim: true,
    },
    tagline: {
      type: String,
      default: "Compassionate Care, Modern Healthcare",
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    whatsapp: {
      type: String,
      trim: true,
    },
    emergency: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    opdDays: {
      type: String,
      default: "Monday - Saturday",
      trim: true,
    },
    opdTime: {
      type: String,
      default: "10:00 AM - 05:00 PM",
      trim: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    mapUrl: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", settingSchema);