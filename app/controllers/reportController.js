const Report = require("../models/Report");
const Appointment = require("../models/Appointment");

exports.uploadReport = async (req, res) => {
  try {
    const { appointmentId, patientName, ipOpNo, phone, doctor } = req.body;

    // IP/OP No required
    if (!ipOpNo) {
      return res.status(400).json({
        success: false,
        message: "IP/OP No is required",
      });
    }

    // Phone required
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    // File required
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Report file is required",
      });
    }

    let finalPatientName = patientName || "";
    let finalDoctor = doctor || "";
    let appointment = null;

    // Appointment optional hai
    if (appointmentId) {
      appointment = await Appointment.findById(appointmentId);

      if (appointment) {
        finalPatientName = patientName || appointment.name || "";
        finalDoctor = doctor || appointment.doctor || "";
      }
    }

    const ext = req.file.mimetype.includes("pdf") ? "PDF" : "IMAGE";

    const report = await Report.create({
      appointment: appointment ? appointment._id : undefined,
      patientName: finalPatientName,
      ipOpNo: ipOpNo.trim(),
      phone: phone.trim(),
      doctor: finalDoctor,
      file: `/uploads/${req.file.filename}`,
      fileType: ext,
    });

    res.status(201).json({
      success: true,
      message: "Report uploaded successfully",
      data: report,
    });
  } catch (error) {
    console.error("Upload Report Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while uploading report",
    });
  }
};


// Search reports using IP/OP No + Mobile
exports.getReportsByIpOpAndPhone = async (req, res) => {
  try {
    const { ipOpNo, phone } = req.query;

    if (!ipOpNo) {
      return res.status(400).json({
        success: false,
        message: "IP/OP No is required",
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    const reports = await Report.find({
      ipOpNo: ipOpNo.trim(),
      phone: phone.trim(),
    })
      .populate("appointment")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("Get Reports Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching reports",
    });
  }
};


// Get all reports - Admin
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("appointment")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("Get All Reports Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching reports",
    });
  }
};


// Get reports by appointment - optional
exports.getReportsByAppointment = async (req, res) => {
  try {
    const reports = await Report.find({
      appointment: req.params.appointmentId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("Get Reports By Appointment Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching reports",
    });
  }
};