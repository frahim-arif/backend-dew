const mongoose = require("mongoose");

const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

const {
  sendHospitalEmail,
  sendPatientEmail,
  sendConfirmationEmail,
  sendCompletedEmail,
  sendCancelledEmail,
} = require("../utils/sendEmail");

// YYYY-MM-DD local date
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Minimum appointment date kal
const getTomorrowDate = () => {
  const tomorrow = new Date();

  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return formatDate(tomorrow);
};

// Department compare helper
const normalizeText = (value = "") => {
  return String(value).trim().toLowerCase();
};

// CREATE APPOINTMENT
exports.createAppointment = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      age,
      gender,
      department,
      date,
      doctor,
      doctorId,
      message,
    } = req.body;

    // Required fields
    if (
      !name?.trim() ||
      !phone?.trim() ||
      !department?.trim() ||
      !date ||
      !doctor?.trim() ||
      !doctorId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, phone, department, date, doctor and doctorId are required",
      });
    }

    // Phone validation
    if (!/^[0-9]{10}$/.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10 digit mobile number",
      });
    }

    // Doctor ID validation
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
    }

    // Appointment minimum kal se
    const tomorrowDate = getTomorrowDate();

    if (date < tomorrowDate) {
      return res.status(400).json({
        success: false,
        message:
          "Appointment kam se kam 1 din pehle book karna hoga. Kal ya uske baad ki date select karein.",
      });
    }

    // MongoDB se doctor check
    const selectedDoctor = await Doctor.findById(doctorId);

    if (!selectedDoctor) {
      return res.status(404).json({
        success: false,
        message: "Selected doctor not found",
      });
    }

    // Active doctor check
    if (selectedDoctor.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Selected doctor is currently inactive",
      });
    }

    // Doctor name check
    if (normalizeText(selectedDoctor.name) !== normalizeText(doctor)) {
      return res.status(400).json({
        success: false,
        message: "Selected doctor information does not match",
      });
    }

    // Department-wise doctor validation
    if (
      normalizeText(selectedDoctor.department) !== normalizeText(department)
    ) {
      return res.status(400).json({
        success: false,
        message: `Selected doctor ${department} department me available nahi hai`,
      });
    }

    // Age validation
    if (age) {
      const numericAge = Number(age);

      if (
        Number.isNaN(numericAge) ||
        numericAge < 1 ||
        numericAge > 120
      ) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid age",
        });
      }
    }

    const appointment = await Appointment.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || "",
      age: age ? String(age).trim() : "",
      gender: gender?.trim() || "",
      department: selectedDoctor.department,
      date,
      doctor: selectedDoctor.name,
      doctorId: selectedDoctor._id,
      message: message?.trim() || "",
      status: "Pending",
    });

    // Hospital email
    try {
      await sendHospitalEmail(appointment);
      console.log("✅ Hospital email sent");
    } catch (error) {
      console.log("❌ Hospital Email Error:", error.message);
    }

    // Patient email sirf email ho tab
    if (appointment.email) {
      try {
        await sendPatientEmail(appointment);
        console.log("✅ Patient email sent");
      } catch (error) {
        console.log("❌ Patient Email Error:", error.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Appointment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while booking appointment",
    });
  }
};

// GET ALL APPOINTMENTS
exports.getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate(
        "doctorId",
        "name specialist department qualification image status"
      )
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error("Get Appointments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching appointments",
    });
  }
};

// UPDATE STATUS + SEND EMAIL
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatus = [
      "Pending",
      "Confirmed",
      "Cancelled",
      "Completed",
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    appointment.status = status;
    await appointment.save();

    // Email sirf patient ka email ho tab
    if (appointment.email) {
      try {
        if (status === "Confirmed") {
          await sendConfirmationEmail(appointment);
          console.log("✅ Confirmation email sent");
        }

        if (status === "Completed") {
          await sendCompletedEmail(appointment);
          console.log("✅ Completed email sent");
        }

        if (status === "Cancelled") {
          await sendCancelledEmail(appointment);
          console.log("✅ Cancelled email sent");
        }
      } catch (emailError) {
        console.log("❌ Status Email Error:", emailError.message);
      }
    }

    return res.json({
      success: true,
      message: `Appointment ${status.toLowerCase()} successfully`,
      data: appointment,
    });
  } catch (error) {
    console.error("Update Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating status",
    });
  }
};

// DELETE APPOINTMENT
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("Delete Appointment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting appointment",
    });
  }
};