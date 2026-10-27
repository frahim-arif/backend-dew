
const { Resend } = require("resend");

// ============================
// Resend Email API Configuration
// ============================

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  "Dew Care Hospital <onboarding@resend.dev>";

const HOSPITAL_EMAIL = process.env.HOSPITAL_EMAIL;

// Escape dynamic values before inserting them into HTML.
const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// ============================
// Common Email Helper
// ============================

const sendEmail = async (mailOptions, label) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing");
    }

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
    });

    if (error) {
      throw new Error(error.message || "Email provider rejected the request");
    }

    console.log(
      `Email accepted by provider: ${label}. ID: ${data?.id || "N/A"}`
    );

    return data;
  } catch (error) {
    console.error(`Email sending failed: ${label}`, {
      message: error.message,
      statusCode: error.statusCode,
    });

    // Email failure must not interrupt appointment/payment processing.
    return null;
  }
};

// ============================
// Hospital Notification
// ============================

const sendHospitalEmail = async (appointment) => {
  if (!HOSPITAL_EMAIL) {
    console.error("HOSPITAL_EMAIL is missing");
    return null;
  }

  return sendEmail(
    {
      to: HOSPITAL_EMAIL,
      subject: "New Appointment Request - Dew Care Hospital",
      html: `
        <h2>New Appointment Request</h2>
        <p><b>Name:</b> ${escapeHtml(appointment.name || "-")}</p>
        <p><b>Phone:</b> ${escapeHtml(appointment.phone || "-")}</p>
        <p><b>Email:</b> ${escapeHtml(appointment.email || "N/A")}</p>
        <p><b>Age:</b> ${escapeHtml(appointment.age ?? "N/A")}</p>
        <p><b>Gender:</b> ${escapeHtml(appointment.gender || "N/A")}</p>
        <p><b>Department:</b> ${escapeHtml(appointment.department || "-")}</p>
        <p><b>Date:</b> ${escapeHtml(appointment.date || "-")}</p>
        <p><b>Time:</b> ${escapeHtml(appointment.time || "N/A")}</p>
        <p><b>Doctor:</b> ${escapeHtml(appointment.doctor || "N/A")}</p>
        <p><b>Problem:</b> ${escapeHtml(appointment.message || "N/A")}</p>
      `,
    },
    "Hospital Email"
  );
};

// ============================
// Booking Received Email
// ============================

const sendPatientEmail = async (appointment) => {
  if (!appointment.email) return null;

  return sendEmail(
    {
      to: appointment.email,
      subject: "Appointment Request Received - Dew Care Hospital",
      html: `
        <h2>Appointment Request Received</h2>
        <p>Dear <b>${escapeHtml(appointment.name || "Patient")}</b>,</p>
        <p>Thank you for choosing Dew Care Hospital.</p>
        <p>
          We have received your appointment request.
          Our team will review it and contact you shortly.
        </p>
        <hr />
        <h3>Appointment Details</h3>
        <p><b>Department:</b> ${escapeHtml(appointment.department || "-")}</p>
        <p><b>Date:</b> ${escapeHtml(appointment.date || "-")}</p>
        <p><b>Time:</b> ${escapeHtml(appointment.time || "N/A")}</p>
        <p><b>Doctor:</b> ${escapeHtml(appointment.doctor || "-")}</p>
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
  if (!appointment.email) return null;

  return sendEmail(
    {
      to: appointment.email,
      subject: "Appointment Confirmed - Dew Care Hospital",
      html: `
        <h2 style="color:#16a34a">Your Appointment has been Confirmed</h2>
        <p>Dear <b>${escapeHtml(appointment.name || "Patient")}</b>,</p>
        <p>Your appointment has been successfully confirmed.</p>
        <table border="1" cellpadding="10" style="border-collapse:collapse">
          <tr>
            <td><b>Department</b></td>
            <td>${escapeHtml(appointment.department || "-")}</td>
          </tr>
          <tr>
            <td><b>Date</b></td>
            <td>${escapeHtml(appointment.date || "-")}</td>
          </tr>
          <tr>
            <td><b>Time</b></td>
            <td>${escapeHtml(appointment.time || "N/A")}</td>
          </tr>
          <tr>
            <td><b>Doctor</b></td>
            <td>${escapeHtml(appointment.doctor || "-")}</td>
          </tr>
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
  if (!appointment.email) return null;

  return sendEmail(
    {
      to: appointment.email,
      subject: "Appointment Completed - Dew Care Hospital",
      html: `
        <h2 style="color:#2563eb">Thank You For Visiting Dew Care Hospital</h2>
        <p>Dear <b>${escapeHtml(appointment.name || "Patient")}</b>,</p>
        <p>
          Your appointment with
          <b>${escapeHtml(appointment.doctor || "our doctor")}</b>
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
  if (!appointment.email) return null;

  return sendEmail(
    {
      to: appointment.email,
      subject: "Appointment Cancelled - Dew Care Hospital",
      html: `
        <h2 style="color:#dc2626">Appointment Cancelled</h2>
        <p>Dear <b>${escapeHtml(appointment.name || "Patient")}</b>,</p>
        <p>
          Unfortunately, your appointment with
          <b>${escapeHtml(appointment.doctor || "our doctor")}</b>
          has been cancelled.
        </p>
        <p>Please contact Dew Care Hospital to schedule another appointment.</p>
        <b>Dew Care Hospital</b>
      `,
    },
    "Cancelled Email"
  );
};

// ============================
// Configuration Check
// ============================

const verifyEmailConnection = async () => {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is missing");
    return false;
  }

  console.log("Resend API key is configured.");
  return true;
};

module.exports = {
  sendHospitalEmail,
  sendPatientEmail,
  sendConfirmationEmail,
  sendCompletedEmail,
  sendCancelledEmail,
  verifyEmailConnection,
};
