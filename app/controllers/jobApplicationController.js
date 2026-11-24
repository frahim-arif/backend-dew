
const JobApplication = require("../models/JobApplication");

// PUBLIC: Submit application
exports.createJobApplication = async (req, res) => {
  try {
    const {
      applyFor,
      applyBranch,
      applicantName,
      mobileNumber,
      emailAddress,
      address,
      highestQualification,
      highestPassing,
      professionalQualifications,
      employmentStatus,
      experience,
      workPlaces,
    } = req.body;

    if (
      !applyFor ||
      !applyBranch ||
      !applicantName ||
      !mobileNumber ||
      !address ||
      !highestQualification ||
      !highestPassing ||
      !employmentStatus
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    if (!/^[0-9]{10}$/.test(String(mobileNumber))) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number.",
      });
    }

    const application = await JobApplication.create({
      applyFor,
      applyBranch,
      applicantName,
      mobileNumber,
      emailAddress,
      address,
      highestQualification,
      highestPassing,
      professionalQualifications:
        Array.isArray(professionalQualifications)
          ? professionalQualifications
          : [],
      employmentStatus,
      experience,
      workPlaces: Array.isArray(workPlaces) ? workPlaces : [],
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully.",
      applicationId: application.applicationId,
    });
  } catch (error) {
    console.error("Create Job Application:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit application.",
    });
  }
};

// ADMIN: Get all applications
exports.getJobApplications = async (req, res) => {
  try {
    const applications = await JobApplication.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("Get Job Applications:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load applications.",
    });
  }
};

// ADMIN: Update application status
exports.updateJobApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Shortlisted",
      "Interview",
      "Selected",
      "Rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application status.",
      });
    }

    const application = await JobApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application status updated.",
      application,
    });
  } catch (error) {
    console.error("Update Job Application:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update application status.",
    });
  }
};
