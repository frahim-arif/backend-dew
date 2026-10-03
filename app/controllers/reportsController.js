const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

/* =========================================================
   HELPERS
========================================================= */

/**
 * India date: YYYY-MM-DD
 */
const getIndiaDate = (date = new Date()) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(date);
};

/**
 * Validate YYYY-MM-DD
 */
const isValidDateString = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00+05:30`);

  return !Number.isNaN(date.getTime());
};

/**
 * Get previous day
 */
const getPreviousDate = (dateString) => {
  const date = new Date(`${dateString}T00:00:00+05:30`);

  date.setDate(date.getDate() - 1);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(date);
};

/**
 * Get first day of current month
 */
const getMonthStart = (dateString) => {
  return `${dateString.slice(0, 7)}-01`;
};

/**
 * Get report date range
 */
const getReportRange = (query) => {
  const today = getIndiaDate();

  let from = today;
  let to = today;

  const period = String(query.period || "").toLowerCase();

  /* -----------------------------------------
     TODAY
  ----------------------------------------- */

  if (period === "today") {
    from = today;
    to = today;
  }

  /* -----------------------------------------
     PREVIOUS DAY
  ----------------------------------------- */

  else if (
    period === "previous" ||
    period === "yesterday" ||
    period === "previous-day"
  ) {
    from = getPreviousDate(today);
    to = from;
  }

  /* -----------------------------------------
     CURRENT MONTH
  ----------------------------------------- */

  else if (
    period === "month" ||
    period === "monthly" ||
    period === "current-month"
  ) {
    from = getMonthStart(today);
    to = today;
  }

  /* -----------------------------------------
     CUSTOM RANGE
  ----------------------------------------- */

  else if (query.from || query.to) {
    from = query.from || today;
    to = query.to || from;
  }

  /* -----------------------------------------
     DEFAULT = TODAY
  ----------------------------------------- */

  else {
    from = today;
    to = today;
  }

  return {
    from,
    to,
  };
};

/**
 * Build empty doctor report
 */
const createDoctorReport = ({
  doctorId,
  doctorName,
  department,
}) => {
  return {
    doctorId: doctorId || null,
    doctorName: doctorName || "Unknown Doctor",
    department: department || "",

    appointments: 0,
    patientsSeen: 0,

    confirmed: 0,
    completed: 0,
    cancelled: 0,
    pending: 0,
    pendingPayment: 0,

    paidAppointments: 0,
    totalCollected: 0,
  };
};

/* =========================================================
   DOCTOR-WISE REPORT
   GET /api/reports/doctors
========================================================= */

exports.getDoctorReports = async (req, res) => {
  try {
    const { from, to } = getReportRange(req.query);

    /* -----------------------------------------
       VALIDATE DATES
    ----------------------------------------- */

    if (!isValidDateString(from)) {
      return res.status(400).json({
        success: false,
        message: "Invalid from date. Use YYYY-MM-DD.",
      });
    }

    if (!isValidDateString(to)) {
      return res.status(400).json({
        success: false,
        message: "Invalid to date. Use YYYY-MM-DD.",
      });
    }

    if (from > to) {
      return res.status(400).json({
        success: false,
        message: "From date cannot be greater than to date.",
      });
    }

    /* -----------------------------------------
       OPTIONAL DOCTOR FILTER
    ----------------------------------------- */

    let doctorId = null;

    if (req.query.doctorId) {
      if (!mongoose.isValidObjectId(req.query.doctorId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor ID.",
        });
      }

      doctorId = req.query.doctorId;
    }

    /* -----------------------------------------
       APPOINTMENT FILTER
    ----------------------------------------- */

    const appointmentFilter = {
      date: {
        $gte: from,
        $lte: to,
      },
    };

    if (doctorId) {
      appointmentFilter.doctorId = doctorId;
    }

    /* -----------------------------------------
       GET APPOINTMENTS
    ----------------------------------------- */

    const appointments = await Appointment.find(
      appointmentFilter
    )
      .populate(
        "doctorId",
        "name specialist department qualification status"
      )
      .sort({
        date: 1,
        createdAt: 1,
      })
      .lean();

    /* -----------------------------------------
       SUMMARY
    ----------------------------------------- */

    const summary = {
      totalAppointments: 0,

      patientsSeen: 0,

      confirmed: 0,
      completed: 0,
      cancelled: 0,
      pending: 0,
      pendingPayment: 0,

      paidAppointments: 0,
      totalCollected: 0,
    };

    /* -----------------------------------------
       DOCTOR REPORT MAP
    ----------------------------------------- */

    const doctorMap = new Map();

    /* -----------------------------------------
       DAILY REPORT MAP
    ----------------------------------------- */

    const dailyMap = new Map();

    /* -----------------------------------------
       PROCESS APPOINTMENTS
    ----------------------------------------- */

    for (const appointment of appointments) {
      summary.totalAppointments += 1;

      /* ---------------------------------------
         STATUS
      --------------------------------------- */

      if (appointment.status === "Confirmed") {
        summary.confirmed += 1;
      }

      if (appointment.status === "Completed") {
        summary.completed += 1;
        summary.patientsSeen += 1;
      }

      if (appointment.status === "Cancelled") {
        summary.cancelled += 1;
      }

      if (appointment.status === "Pending") {
        summary.pending += 1;
      }

      if (appointment.status === "Pending Payment") {
        summary.pendingPayment += 1;
      }

      /* ---------------------------------------
         PAYMENT
      --------------------------------------- */

      const isPaid =
        appointment.paymentStatus === "Paid";

      const paymentAmount = Number(
        appointment.paymentAmount || 0
      );

      if (isPaid) {
        summary.paidAppointments += 1;

        summary.totalCollected += paymentAmount;
      }

      /* ---------------------------------------
         DOCTOR INFORMATION
      --------------------------------------- */

      const populatedDoctor =
        appointment.doctorId &&
        typeof appointment.doctorId === "object"
          ? appointment.doctorId
          : null;

      const currentDoctorId =
        populatedDoctor?._id?.toString() ||
        appointment.doctorId?.toString() ||
        "unknown";

      const currentDoctorName =
        populatedDoctor?.name ||
        appointment.doctor ||
        "Unknown Doctor";

      const currentDepartment =
        populatedDoctor?.department ||
        appointment.department ||
        "";

      /* ---------------------------------------
         CREATE DOCTOR REPORT
      --------------------------------------- */

      if (!doctorMap.has(currentDoctorId)) {
        doctorMap.set(
          currentDoctorId,
          createDoctorReport({
            doctorId:
              currentDoctorId === "unknown"
                ? null
                : currentDoctorId,

            doctorName: currentDoctorName,

            department: currentDepartment,
          })
        );
      }

      const doctorReport =
        doctorMap.get(currentDoctorId);

      /* ---------------------------------------
         DOCTOR COUNTS
      --------------------------------------- */

      doctorReport.appointments += 1;

      if (appointment.status === "Completed") {
        doctorReport.completed += 1;
        doctorReport.patientsSeen += 1;
      }

      if (appointment.status === "Confirmed") {
        doctorReport.confirmed += 1;
      }

      if (appointment.status === "Cancelled") {
        doctorReport.cancelled += 1;
      }

      if (appointment.status === "Pending") {
        doctorReport.pending += 1;
      }

      if (appointment.status === "Pending Payment") {
        doctorReport.pendingPayment += 1;
      }

      /* ---------------------------------------
         DOCTOR PAYMENT
      --------------------------------------- */

      if (isPaid) {
        doctorReport.paidAppointments += 1;

        doctorReport.totalCollected +=
          paymentAmount;
      }

      /* ---------------------------------------
         DAILY REPORT
      --------------------------------------- */

      const appointmentDate = appointment.date;

      if (!dailyMap.has(appointmentDate)) {
        dailyMap.set(appointmentDate, {
          date: appointmentDate,

          appointments: 0,
          patientsSeen: 0,

          confirmed: 0,
          completed: 0,
          cancelled: 0,
          pending: 0,
          pendingPayment: 0,

          paidAppointments: 0,
          totalCollected: 0,
        });
      }

      const dailyReport =
        dailyMap.get(appointmentDate);

      dailyReport.appointments += 1;

      if (appointment.status === "Completed") {
        dailyReport.completed += 1;
        dailyReport.patientsSeen += 1;
      }

      if (appointment.status === "Confirmed") {
        dailyReport.confirmed += 1;
      }

      if (appointment.status === "Cancelled") {
        dailyReport.cancelled += 1;
      }

      if (appointment.status === "Pending") {
        dailyReport.pending += 1;
      }

      if (appointment.status === "Pending Payment") {
        dailyReport.pendingPayment += 1;
      }

      if (isPaid) {
        dailyReport.paidAppointments += 1;

        dailyReport.totalCollected +=
          paymentAmount;
      }
    }

    /* -----------------------------------------
       ROUND MONEY VALUES
    ----------------------------------------- */

    summary.totalCollected = Number(
      summary.totalCollected.toFixed(2)
    );

    /* -----------------------------------------
       DOCTORS ARRAY
    ----------------------------------------- */

    const doctors = Array.from(
      doctorMap.values()
    ).map((doctor) => ({
      ...doctor,

      totalCollected: Number(
        doctor.totalCollected.toFixed(2)
      ),
    }));

    /* -----------------------------------------
       DAILY ARRAY
    ----------------------------------------- */

    const daily = Array.from(
      dailyMap.values()
    )
      .map((day) => ({
        ...day,

        totalCollected: Number(
          day.totalCollected.toFixed(2)
        ),
      }))
      .sort((a, b) =>
        a.date.localeCompare(b.date)
      );

    /* -----------------------------------------
       RESPONSE
    ----------------------------------------- */

    return res.status(200).json({
      success: true,

      data: {
        period: {
          from,
          to,
        },

        summary,

        doctors,

        daily,
      },
    });
  } catch (error) {
    console.error(
      "Get doctor reports error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Unable to generate doctor reports.",
    });
  }
};