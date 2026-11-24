
const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      unique: true,
      default: () => "DCJ-" + Date.now().toString().slice(-8),
    },

    applyFor: {
      type: String,
      required: true,
      trim: true,
    },

    applyBranch: {
      type: String,
      required: true,
      trim: true,
    },

    applicantName: {
      type: String,
      required: true,
      trim: true,
    },

    mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },

    emailAddress: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    highestQualification: {
      type: String,
      required: true,
      trim: true,
    },

    highestPassing: {
      type: String,
      required: true,
      trim: true,
    },

    professionalQualifications: [
      {
        qualification: String,
        yearOfPassing: String,
      },
    ],

    employmentStatus: {
      type: String,
      enum: ["Fresher", "Experienced"],
      required: true,
    },

    experience: {
      type: String,
      default: "",
    },

    workPlaces: [
      {
        workplace: String,
        fromYear: String,
        toYear: String,
      },
    ],

    status: {
      type: String,
      enum: ["Pending", "Shortlisted", "Interview", "Selected", "Rejected"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.JobApplication ||
  mongoose.model("JobApplication", jobApplicationSchema);
