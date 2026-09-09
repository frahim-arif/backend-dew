const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Gallery title is required"],
      trim: true,
    },

    type: {
      type: String,
      enum: ["image", "video"],
      default: "image",
      required: true,
    },

    // Image Path
    image: {
      type: String,
      default: "",
      trim: true,
    },

    // YouTube URL
    youtubeUrl: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "Hospital",
        "Doctors",
        "Patients",
        "Events",
        "Operation",
        "Facilities",
        "Emergency",
        "Others",
      ],
      default: "Hospital",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Gallery", gallerySchema);