const TrainingApplication = require("../models/TrainingApplication");
const TrainingCourse = require("../models/TrainingCourse");

/* ==========================================================
   Get All Applications
========================================================== */

const getApplications = async (req, res) => {
  try {
    const applications = await TrainingApplication.find()
      .populate("course")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================================
   Create Application
========================================================== */

const createApplication = async (req, res) => {
  try {
    console.log("========== REQUEST BODY ==========");
    console.log(req.body);
    console.log("=================================");

    const {
      course,
      name,
      fatherName,
      motherName,
      gender,
      dob,
      phone,
      alternatePhone,
      email,
      address,
      city,
      state,
      pincode,
      qualification,
      institute,
      passingYear,
      aadhaar,
    } = req.body;

    const missingFields = [];

    if (!course) missingFields.push("course");
    if (!name) missingFields.push("name");
    if (!phone) missingFields.push("phone");
    if (!gender) missingFields.push("gender");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Check Course

    const courseExists = await TrainingCourse.findById(course);

    if (!courseExists) {
      return res.status(404).json({
        success: false,
        message: "Training course not found.",
      });
    }

    // Generate Application Number

    const totalApplications =
      await TrainingApplication.countDocuments();

    const applicationNo = `DCT-${new Date().getFullYear()}-${String(
      totalApplications + 1
    ).padStart(6, "0")}`;

    // Create Application

    const application = await TrainingApplication.create({
      applicationNo,
      course,
      name,
      fatherName,
      motherName,
      gender,
      dob,
      phone,
      alternatePhone,
      email,
      address,
      city,
      state,
      pincode,
      qualification,
      institute,
      passingYear,
      aadhaar,
      photo: req.file
        ? `/uploads/${req.file.filename}`
        : "",
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully.",
      data: application,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================================
   Get Single Application
========================================================== */

const getApplication = async (req, res) => {
  try {
    const application = await TrainingApplication.findById(
      req.params.id
    ).populate("course");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================================
   Update Application
========================================================== */

const updateApplication = async (req, res) => {
  try {
    const application =
      await TrainingApplication.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    res.json({
      success: true,
      message: "Application updated successfully.",
      data: application,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================================
   Update Status
========================================================== */

const updateApplicationStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const application =
      await TrainingApplication.findByIdAndUpdate(
        req.params.id,
        {
          status,
          remarks,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    res.json({
      success: true,
      message: "Application status updated successfully.",
      data: application,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================================
   Delete Application
========================================================== */

const deleteApplication = async (req, res) => {
  try {
    const application =
      await TrainingApplication.findByIdAndDelete(
        req.params.id
      );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    res.json({
      success: true,
      message: "Application deleted successfully.",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================================
   Dashboard Stats
========================================================== */

const getApplicationStats = async (req, res) => {
  try {
    const total =
      await TrainingApplication.countDocuments();

    const pending =
      await TrainingApplication.countDocuments({
        status: "Pending",
      });

    const approved =
      await TrainingApplication.countDocuments({
        status: "Approved",
      });

    const rejected =
      await TrainingApplication.countDocuments({
        status: "Rejected",
      });

    const completed =
      await TrainingApplication.countDocuments({
        status: "Completed",
      });

    res.json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        completed,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getApplications,
  createApplication,
  getApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
  getApplicationStats,
};