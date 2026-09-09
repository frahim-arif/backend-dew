const Prescription = require("../models/Prescription");
const Appointment = require("../models/Appointment");

exports.uploadPrescription = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Prescription file is required",
      });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const ext = req.file.mimetype.includes("pdf") ? "PDF" : "IMAGE";

    const prescription = await Prescription.create({
      appointment: appointment._id,
      patientName: appointment.name,
      phone: appointment.phone,
      doctor: appointment.doctor,
      file: `/uploads/${req.file.filename}`,
      fileType: ext,
    });

    res.status(201).json({
      success: true,
      message: "Prescription uploaded successfully",
      data: prescription,
    });
  } catch (error) {
    console.error("Upload Prescription Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading prescription",
    });
  }
};
exports.getPrescriptionsByPhone = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const prescriptions = await Prescription.find({ phone })
      .populate("appointment")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    console.error("Get Prescriptions By Phone Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching prescriptions",
    });
  }
};
exports.getPrescriptionByAppointment = async (req, res) => {
  try {
    const prescription = await Prescription.findOne({
      appointment: req.params.appointmentId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    console.error("Get Prescription Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching prescription",
    });
  }
};

exports.getAllPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate("appointment")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    console.error("Get Prescriptions Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching prescriptions",
    });
  }
};