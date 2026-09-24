const Doctor = require("../models/Doctor");

const parseOpdDays = (opdDays) => {
  if (!opdDays) return [];

  if (Array.isArray(opdDays)) {
    return opdDays;
  }

  try {
    return JSON.parse(opdDays);
  } catch {
    return String(opdDays)
      .split(",")
      .map((day) => day.trim())
      .filter(Boolean);
  }
};

exports.createDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create({
      name: req.body.name,
      specialist: req.body.specialist,
      qualification: req.body.qualification,
      experience: req.body.experience,
      department: req.body.department,

      opdStartTime: req.body.opdStartTime,
      opdEndTime: req.body.opdEndTime,
      opdDays: parseOpdDays(req.body.opdDays),

      slotDuration: Number(req.body.slotDuration || 15),
      maxPatientsPerDay: Number(req.body.maxPatientsPerDay || 30),

      status: req.body.status || "Active",

      // Cloudinary URL
      image: req.file ? req.file.path : "",
    });

    res.status(201).json({
      success: true,
      message: "Doctor added successfully",
      data: doctor,
    });
  } catch (error) {
    console.error("CREATE DOCTOR ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error while adding doctor",
      error: error.message,
    });
  }
};

exports.getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    console.error("GET DOCTORS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching doctors",
    });
  }
};

exports.updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    doctor.name = req.body.name;
    doctor.specialist = req.body.specialist;
    doctor.qualification = req.body.qualification;
    doctor.experience = req.body.experience;
    doctor.department = req.body.department;

    doctor.opdStartTime = req.body.opdStartTime;
    doctor.opdEndTime = req.body.opdEndTime;
    doctor.opdDays = parseOpdDays(req.body.opdDays);

    doctor.slotDuration = Number(req.body.slotDuration || 15);
    doctor.maxPatientsPerDay = Number(
      req.body.maxPatientsPerDay || 30
    );

    doctor.status = req.body.status || "Active";

    // New image uploaded
    if (req.file) {
      doctor.image = req.file.path;
    }

    await doctor.save();

    res.json({
      success: true,
      message: "Doctor updated successfully",
      data: doctor,
    });
  } catch (error) {
    console.error("UPDATE DOCTOR ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating doctor",
      error: error.message,
    });
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    await doctor.deleteOne();

    res.json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    console.error("DELETE DOCTOR ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting doctor",
      error: error.message,
    });
  }
};