const mongoose = require("mongoose");

const facilitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    desc: { type: String, required: true, trim: true },
    icon: { type: String, trim: true },
    image: { type: String, trim: true },
    category: {
      type: String,
      enum: ["Treatment", "Diagnostic", "Emergency", "Laboratory", "General"],
      default: "General",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Facility", facilitySchema);