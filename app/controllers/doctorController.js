const Doctor = require("../models/Doctor");

// ==================================================
// PARSE OPD DAYS
// ==================================================
const parseOpdDays = (opdDays) => {
  if (!opdDays) return [];

  if (Array.isArray(opdDays)) {
    return opdDays;
  }

  try {
    const parsed = JSON.parse(opdDays);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return [];
  } catch {
    return String(opdDays)
      .split(",")
      .map((day) => day.trim())
      .filter(Boolean);
  }
};

// ==================================================
// PARSE BOOLEAN
// ==================================================
const parseBoolean = (value, defaultValue = false) => {
  if (
    value === true ||
    value === "true" ||
    value === "1" ||
    value === 1
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false" ||
    value === "0" ||
    value === 0
  ) {
    return false;
  }

  return defaultValue;
};

// ==================================================
// CREATE DOCTOR
// ==================================================
exports.createDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create({
      // ----------------------------------------------
      // BASIC
      // ----------------------------------------------
      name: req.body.name,
      specialist: req.body.specialist,
      qualification: req.body.qualification || "",
      experience: req.body.experience || "",
      department: req.body.department || "",

      // ----------------------------------------------
      // AVAILABILITY
      // ----------------------------------------------
      opdAvailable: parseBoolean(
        req.body.opdAvailable,
        true
      ),

      indoorDoctor: parseBoolean(
        req.body.indoorDoctor,
        false
      ),

      // ----------------------------------------------
      // FEES
      // ----------------------------------------------
      opdFee: Number(req.body.opdFee || 0),

      indoorFee: Number(
        req.body.indoorFee || 0
      ),

      // ----------------------------------------------
      // OPD SCHEDULE
      // ----------------------------------------------
      opdStartTime:
        req.body.opdStartTime || "",

      opdEndTime:
        req.body.opdEndTime || "",

      opdDays: parseOpdDays(
        req.body.opdDays
      ),

      slotDuration: Number(
        req.body.slotDuration || 15
      ),

      maxPatientsPerDay: Number(
        req.body.maxPatientsPerDay || 30
      ),

      // ----------------------------------------------
      // STATUS
      // ----------------------------------------------
      status:
        req.body.status || "Active",

      // ----------------------------------------------
      // CLOUDINARY IMAGE
      // ----------------------------------------------
      image: req.file
        ? req.file.path
        : "",
    });

    return res.status(201).json({
      success: true,
      message: "Doctor added successfully",
      data: doctor,
    });
  } catch (error) {
    console.error(
      "CREATE DOCTOR ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while adding doctor",
      error: error.message,
    });
  }
};

// ==================================================
// GET ALL DOCTORS
// ==================================================
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    console.error(
      "GET DOCTORS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching doctors",
    });
  }
};

// ==================================================
// GET SINGLE DOCTOR
// ==================================================
exports.getDoctorById = async (req, res) => {
  try {
    const doctor =
      await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.error(
      "GET DOCTOR ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching doctor",
    });
  }
};

// ==================================================
// UPDATE DOCTOR
// ==================================================
exports.updateDoctor = async (req, res) => {
  try {
    const doctor =
      await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // ----------------------------------------------
    // BASIC
    // ----------------------------------------------
    doctor.name =
      req.body.name ?? doctor.name;

    doctor.specialist =
      req.body.specialist ??
      doctor.specialist;

    doctor.qualification =
      req.body.qualification ??
      doctor.qualification;

    doctor.experience =
      req.body.experience ??
      doctor.experience;

    doctor.department =
      req.body.department ??
      doctor.department;

    // ----------------------------------------------
    // AVAILABILITY
    // ----------------------------------------------
    if (
      req.body.opdAvailable !== undefined
    ) {
      doctor.opdAvailable =
        parseBoolean(
          req.body.opdAvailable,
          doctor.opdAvailable
        );
    }

    if (
      req.body.indoorDoctor !== undefined
    ) {
      doctor.indoorDoctor =
        parseBoolean(
          req.body.indoorDoctor,
          doctor.indoorDoctor
        );
    }

    // ----------------------------------------------
    // FEES
    // ----------------------------------------------
    if (req.body.opdFee !== undefined) {
      doctor.opdFee = Number(
        req.body.opdFee
      );
    }

    if (
      req.body.indoorFee !== undefined
    ) {
      doctor.indoorFee = Number(
        req.body.indoorFee
      );
    }

    // ----------------------------------------------
    // OPD SCHEDULE
    // ----------------------------------------------
    if (
      req.body.opdStartTime !== undefined
    ) {
      doctor.opdStartTime =
        req.body.opdStartTime;
    }

    if (
      req.body.opdEndTime !== undefined
    ) {
      doctor.opdEndTime =
        req.body.opdEndTime;
    }

    if (
      req.body.opdDays !== undefined
    ) {
      doctor.opdDays =
        parseOpdDays(
          req.body.opdDays
        );
    }

    // ----------------------------------------------
    // SLOT SETTINGS
    // ----------------------------------------------
    if (
      req.body.slotDuration !== undefined
    ) {
      doctor.slotDuration =
        Number(req.body.slotDuration);
    }

    if (
      req.body.maxPatientsPerDay !==
      undefined
    ) {
      doctor.maxPatientsPerDay =
        Number(
          req.body.maxPatientsPerDay
        );
    }

    // ----------------------------------------------
    // STATUS
    // ----------------------------------------------
    if (req.body.status !== undefined) {
      doctor.status =
        req.body.status;
    }

    // ----------------------------------------------
    // NEW CLOUDINARY IMAGE
    // ----------------------------------------------
    if (req.file) {
      doctor.image =
        req.file.path;
    }

    await doctor.save();

    return res.json({
      success: true,
      message:
        "Doctor updated successfully",
      data: doctor,
    });
  } catch (error) {
    console.error(
      "UPDATE DOCTOR ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating doctor",
      error: error.message,
    });
  }
};

// ==================================================
// DELETE DOCTOR
// ==================================================
exports.deleteDoctor = async (req, res) => {
  try {
    const doctor =
      await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    await doctor.deleteOne();

    return res.json({
      success: true,
      message:
        "Doctor deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE DOCTOR ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while deleting doctor",
    });
  }
};