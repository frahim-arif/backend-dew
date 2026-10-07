
const Report = require("../models/Report");
const Appointment = require("../models/Appointment");
const mongoose = require("mongoose");



exports.uploadReport = async (req, res) => {
  try {
    const {
      appointmentId,
      patientName,
      ipOpNo,
      phone,
      doctor,
    } = req.body;

    console.log("========== UPLOAD REPORT ==========");
    console.log("appointmentId:", appointmentId);
    console.log("patientName:", patientName);
    console.log("ipOpNo:", ipOpNo);
    console.log("phone:", phone);
    console.log("doctor:", doctor);
    console.log("file:", req.file);

    // IP/OP No required
    if (!ipOpNo || !ipOpNo.trim()) {
      return res.status(400).json({
        success: false,
        message: "IP/OP No is required",
      });
    }

    // Phone required
    if (!phone || !phone.trim()) {
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

    let finalPatientName = patientName?.trim() || "";
    let finalDoctor = doctor?.trim() || "";
    let appointment = null;

    /*
    |--------------------------------------------------------------------------
    | Appointment is optional
    |--------------------------------------------------------------------------
    */

    if (appointmentId && appointmentId.trim()) {
      const cleanAppointmentId = appointmentId.trim();

      // Check MongoDB ObjectId before querying
      if (!mongoose.Types.ObjectId.isValid(cleanAppointmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Appointment ID",
        });
      }

      appointment = await Appointment.findById(
        cleanAppointmentId
      );

      // Appointment ID provided but appointment not found
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      // If patient name was not entered manually,
      // take it from appointment
      if (!finalPatientName) {
        finalPatientName = appointment.name || "";
      }

      // If doctor was not entered manually,
      // take it from appointment
      if (!finalDoctor) {
        finalDoctor = appointment.doctor || "";
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Determine file type
    |--------------------------------------------------------------------------
    */

    const fileType = req.file.mimetype.includes("pdf")
      ? "PDF"
      : "IMAGE";

    /*
    |--------------------------------------------------------------------------
    | Create Report
    |--------------------------------------------------------------------------
    */

    const reportData = {
      patientName: finalPatientName,
      ipOpNo: ipOpNo.trim(),
      phone: phone.trim(),
      doctor: finalDoctor,
      file: `/uploads/${req.file.filename}`,
      fileType,
    };

    // Add appointment only when available
    if (appointment) {
      reportData.appointment = appointment._id;
    }

    const report = await Report.create(reportData);

    console.log("Report created successfully:", report._id);
    console.log("==================================");

    return res.status(201).json({
      success: true,
      message: "Report uploaded successfully",
      data: report,
    });
  } catch (error) {
    console.error("========== UPLOAD REPORT ERROR ==========");
    console.error("Message:", error.message);
    console.error("Name:", error.name);
    console.error("Stack:", error.stack);
    console.error("==========================================");

    return res.status(500).json({
      success: false,
      message: "Server error while uploading report",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| Search Reports
|--------------------------------------------------------------------------
| Search using:
| IP/OP No + Mobile Number
|--------------------------------------------------------------------------
*/

exports.getReportsByIpOpAndPhone = async (req, res) => {
  try {
    const { ipOpNo, phone } = req.query;

    if (!ipOpNo || !ipOpNo.trim()) {
      return res.status(400).json({
        success: false,
        message: "IP/OP No is required",
      });
    }

    if (!phone || !phone.trim()) {
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

    return res.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("Get Reports Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching reports",
    });
  }
};


/*
|--------------------------------------------------------------------------
| Get All Reports
|--------------------------------------------------------------------------
| Admin use
|--------------------------------------------------------------------------
*/

exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("appointment")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("Get All Reports Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching reports",
    });
  }
};


/*
|--------------------------------------------------------------------------
| Get Reports By Appointment
|--------------------------------------------------------------------------
| Used by appointment Report modal
|--------------------------------------------------------------------------
*/

exports.getReportsByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Appointment ID",
      });
    }

    const reports = await Report.find({
      appointment: appointmentId,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error(
      "Get Reports By Appointment Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error while fetching reports",
    });
  }
};

