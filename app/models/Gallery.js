const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    // =========================
    // Gallery Title
    // =========================
    title: {
      type: String,
      required: [true, "Gallery title is required"],
      trim: true,
    },

    // =========================
    // Gallery Type
    // =========================
    type: {
      type: String,
      enum: ["image", "video", "facebook"],
      default: "image",
      required: true,
    },

    // =========================
    // Image Path
    // =========================
    image: {
      type: String,
      default: "",
      trim: true,
    },

    // =========================
    // YouTube URL
    // =========================
    youtubeUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // =========================
    // Facebook Video URL
    // =========================
    facebookUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // =========================
    // Category
    // =========================
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

    // =========================
    // Status
    // =========================
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    // =========================
    // Description
    // =========================
    description: {
      type: String,
      default: "",
      trim: true,
    },

    // =========================
    // Featured
    // =========================
    featured: {
      type: Boolean,
      default: false,
    },

    // =========================
    // Display Order
    // =========================
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