
const nodemailer = require("nodemailer");

// ============================
// Gmail SMTP Configuration
// ============================

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const HOSPITAL_EMAIL = process.env.HOSPITAL_EMAIL;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,

  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },

  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000,
});

// ============================
// Email Helpers
// ============================

const sendEmail = async (mailOptions, label) => {
  try {
    if (!EMAIL_USER || !EMAIL_PASS) {
      throw new Error("EMAIL_USER or EMAIL_PASS is missing");
    }

    const result = await transporter.sendMail({
      from: `"Dew Care Hospital" <${EMAIL_USER}>`,
      ...mailOptions,
    });

    console.log(`✅ ${label} sent successfully. Message ID: ${result.messageId}`);
    return result;
  } catch (error) {
    // Log diagnostic information, never log passwords or email credentials.
    console.error(`❌ ${label} Error:`, {
      message: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
    });

    // Email failure should not crash the appointment/payment flow.
    throw error;
  }
};

// ============================
// Hospital Notification
// ============================

const sendHospitalEmail = async (appointment) => {
  if (!HOSPITAL_EMAIL) {
    throw new Error("HOSPITAL_EMAIL is missing in environment variables");
  }

  return sendEmail(
    {
      to: HOSPITAL_EMAIL,
      subject: "New Appointment Request - Dew Care Hospital",
      html: `
        <h2>New Appointment Request</h2>
        <p><b>Name:</b> ${appointment.name || "-"}</p>
        <p><b>Phone:</b> ${appointment.phone || "-"}</p>
        <p><b>Email:</b> ${appointment.email || "N/A"}</p>
        <p><b>Age:</b> ${appointment.age ?? "N/A"}</p>
        <p><b>Gender:</b> ${appointment.gender || "N/A"}</p>
        <p><b>Department:</b> ${appointment.department || "-"}</p>
        <p><b>Date:</b> ${appointment.date || "-"}</p>
        <p><b>Time:</b> ${appointment.time || "N/A"}</p>
        <p><b>Doctor:</b> ${appointment.doctor || "N/A"}</p>
        <p><b>Problem:</b> ${appointment.message || "N/A"}</p>
      `,
    },
    "Hospital Email"
  );
};

// ============================
// Booking Received Email
// ============================

const sendPatientEmail = async (appointment) => {
  if (!appointment.email) return;

  return sendEmail(
    {
      to: appointment.email,
      subject: "Appointment Request Received - Dew Care Hospital",
      html: `
        <h2>Appointment Request Received</h2>
        <p>Dear <b>${appointment.name || "Patient"}</b>,</p>
        <p>Thank you for choosing Dew Care Hospital.</p>
        <p>
          We have received your appointment request.
          Our team will review it and contact you shortly.
        </p>
        <hr />
        <h3>Appointment Details</h3>
        <p><b>Department:</b> ${appointment.department || "-"}</p>
        <p><b>Date:</b> ${appointment.date || "-"}</p>
        <p><b>Time:</b> ${appointment.time || "N/A"}</p>
        <p><b>Doctor:</b> ${appointment.doctor || "-"}</p>
        <br />
        <b>Dew Care Hospital</b>
      `,
    },
    "Patient Email"
  );
};

// ============================
// Appointment Confirmed
// ============================

const sendConfirmationEmail = async (appointment) => {
  if (!appointment.email) return;

  return sendEmail(
    {
      to: appointment.email,
      subject: "Appointment Confirmed - Dew Care Hospital",
      html: `
        <h2 style="color:#16a34a">Your Appointment has been Confirmed</h2>
        <p>Dear <b>${appointment.name || "Patient"}</b>,</p>
        <p>Your appointment has been successfully confirmed.</p>
        <table border="1" cellpadding="10" style="border-collapse:collapse">
          <tr><td><b>Department</b></td><td>${appointment.department || "-"}</td></tr>
          <tr><td><b>Date</b></td><td>${appointment.date || "-"}</td></tr>
          <tr><td><b>Time</b></td><td>${appointment.time || "N/A"}</td></tr>
          <tr><td><b>Doctor</b></td><td>${appointment.doctor || "-"}</td></tr>
        </table>
        <p>Please arrive 15 minutes before your appointment.</p>
        <b>Dew Care Hospital</b>
      `,
    },
    "Confirmation Email"
  );
};

// ============================
// Appointment Completed
// ============================

const sendCompletedEmail = async (appointment) => {
  if (!appointment.email) return;

  return sendEmail(
    {
      to: appointment.email,
      subject: "Appointment Completed - Dew Care Hospital",
      html: `
        <h2 style="color:#2563eb">Thank You For Visiting Dew Care Hospital</h2>
        <p>Dear <b>${appointment.name || "Patient"}</b>,</p>
        <p>
          Your appointment with <b>${appointment.doctor || "our doctor"}</b>
          has been completed successfully.
        </p>
        <p>We wish you good health.</p>
        <b>Dew Care Hospital</b>
      `,
    },
    "Completed Email"
  );
};

// ============================
// Appointment Cancelled
// ============================

const sendCancelledEmail = async (appointment) => {
  if (!appointment.email) return;

  return sendEmail(
    {
      to: appointment.email,
      subject: "Appointment Cancelled - Dew Care Hospital",
      html: `
        <h2 style="color:#dc2626">Appointment Cancelled</h2>
        <p>Dear <b>${appointment.name || "Patient"}</b>,</p>
        <p>
          Unfortunately, your appointment with
          <b>${appointment.doctor || "our doctor"}</b> has been cancelled.
        </p>
        <p>Please contact Dew Care Hospital to schedule another appointment.</p>
        <b>Dew Care Hospital</b>
      `,
    },
    "Cancelled Email"
  );
};

// ============================
// SMTP Connection Test
// ============================

const verifyEmailConnection = async () => {
  try {
    if (!EMAIL_USER || !EMAIL_PASS) {
      throw new Error("EMAIL_USER or EMAIL_PASS is missing");
    }

    await transporter.verify();
    console.log("✅ Gmail SMTP connection successful");
    return true;
  } catch (error) {
    console.error("❌ Gmail SMTP connection failed:", {
      message: error.message,
      code: error.code,
      command: error.command,
    });
    return false;
  }
};

module.exports = {
  sendHospitalEmail,
  sendPatientEmail,
  sendConfirmationEmail,
  sendCompletedEmail,
  sendCancelledEmail,
  verifyEmailConnection,
};
