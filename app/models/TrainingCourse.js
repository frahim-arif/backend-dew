const mongoose = require("mongoose");

const trainingCourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    shortDescription: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    duration: {
      type: String,
      default: "",
    },

    fees: {
      type: Number,
      default: 0,
    },

    eligibility: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    instructor: {
      type: String,
      default: "",
    },

    seats: {
      type: Number,
      default: 0,
    },

    featured: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model(
  "TrainingCourse",
  trainingCourseSchema
);