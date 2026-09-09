const mongoose = require("mongoose");

const trainingApplicationSchema = new mongoose.Schema(
  {
    applicationNo: {
      type: String,
      unique: true,
      sparse: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrainingCourse",
      required: [true, "Course is required"],
    },

    name: {
      type: String,
      required: [true, "Applicant name is required"],
      trim: true,
    },

    fatherName: {
      type: String,
      trim: true,
      default: "",
    },

    motherName: {
      type: String,
      trim: true,
      default: "",
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: [true, "Gender is required"],
    },

    dob: {
      type: Date,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    alternatePhone: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    pincode: {
      type: String,
      trim: true,
      default: "",
    },

    qualification: {
      type: String,
      trim: true,
      default: "",
    },

    institute: {
      type: String,
      trim: true,
      default: "",
    },

    passingYear: {
      type: String,
      trim: true,
      default: "",
    },

    aadhaar: {
      type: String,
      trim: true,
      default: "",
    },

    photo: {
      type: String,
      default: "",
    },

    aadhaarFile: {
      type: String,
      default: "",
    },

    remarks: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
        "Completed",
      ],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "TrainingApplication",
  trainingApplicationSchema
);