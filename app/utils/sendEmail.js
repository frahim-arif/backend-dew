const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ============================
// Hospital Notification
// ============================

const sendHospitalEmail = async (appointment) => {
  return transporter.sendMail({
    from: `"Dew Care Hospital" <${process.env.EMAIL_USER}>`,
    to: process.env.HOSPITAL_EMAIL,
    subject: "🏥 New Appointment Request - Dew Care Hospital",
    html: `
      <h2>🏥 New Appointment Request</h2>

      <p><b>Name:</b> ${appointment.name}</p>
      <p><b>Phone:</b> ${appointment.phone}</p>
      <p><b>Email:</b> ${appointment.email || "N/A"}</p>
      <p><b>Age:</b> ${appointment.age || "N/A"}</p>
      <p><b>Gender:</b> ${appointment.gender || "N/A"}</p>
      <p><b>Department:</b> ${appointment.department}</p>
      <p><b>Date:</b> ${appointment.date}</p>
      <p><b>Doctor:</b> ${appointment.doctor || "N/A"}</p>
      <p><b>Problem:</b> ${appointment.message || "N/A"}</p>
    `,
  });
};

// ============================
// Booking Received Email
// ============================

const sendPatientEmail = async (appointment) => {
  if (!appointment.email) return;

  return transporter.sendMail({
    from: `"Dew Care Hospital" <${process.env.EMAIL_USER}>`,
    to: appointment.email,
    subject: "✅ Appointment Request Received",
    html: `
      <h2>Appointment Request Received</h2>

      <p>Dear <b>${appointment.name}</b>,</p>

      <p>
        Thank you for choosing Dew Care Hospital.
      </p>

      <p>
        We have successfully received your appointment request.
        Our team will review it and contact you shortly.
      </p>

      <hr>

      <h3>Appointment Details</h3>

      <p><b>Department:</b> ${appointment.department}</p>
      <p><b>Date:</b> ${appointment.date}</p>
      <p><b>Doctor:</b> ${appointment.doctor || "-"}</p>

      <br>

      <b>Dew Care Hospital</b>
    `,
  });
};

// ============================
// Appointment Confirmed
// ============================

const sendConfirmationEmail = async (appointment) => {
  if (!appointment.email) return;

  return transporter.sendMail({
    from: `"Dew Care Hospital" <${process.env.EMAIL_USER}>`,
    to: appointment.email,
    subject: "✅ Appointment Confirmed",

    html: `
    <h2 style="color:#16a34a">
      Your Appointment has been Confirmed
    </h2>

    <p>Dear <b>${appointment.name}</b>,</p>

    <p>
      Your appointment has been successfully confirmed.
    </p>

    <table border="1" cellpadding="10" style="border-collapse:collapse">

      <tr>
        <td><b>Department</b></td>
        <td>${appointment.department}</td>
      </tr>

      <tr>
        <td><b>Date</b></td>
        <td>${appointment.date}</td>
      </tr>

      <tr>
        <td><b>Doctor</b></td>
        <td>${appointment.doctor || "-"}</td>
      </tr>

    </table>

    <br>

    <p>
      Please arrive 15 minutes before your appointment.
    </p>

    <br>

    <b>Dew Care Hospital</b>
    `,
  });
};

// ============================
// Appointment Completed
// ============================

const sendCompletedEmail = async (appointment) => {
  if (!appointment.email) return;

  return transporter.sendMail({
    from: `"Dew Care Hospital" <${process.env.EMAIL_USER}>`,
    to: appointment.email,
    subject: "✔ Appointment Completed",

    html: `
    <h2 style="color:#2563eb">
      Thank You For Visiting Dew Care Hospital
    </h2>

    <p>Dear <b>${appointment.name}</b>,</p>

    <p>
      Your appointment with <b>${appointment.doctor || "our doctor"}</b> has been completed successfully.
    </p>

    <p>
      We wish you good health.
    </p>

    <br>

    <b>Dew Care Hospital</b>
    `,
  });
};

// ============================
// Appointment Cancelled
// ============================

const sendCancelledEmail = async (appointment) => {
  if (!appointment.email) return;

  return transporter.sendMail({
    from: `"Dew Care Hospital" <${process.env.EMAIL_USER}>`,
    to: appointment.email,
    subject: "❌ Appointment Cancelled",

    html: `
    <h2 style="color:#dc2626">
      Appointment Cancelled
    </h2>

    <p>Dear <b>${appointment.name}</b>,</p>

    <p>
      Unfortunately your appointment with
      <b>${appointment.doctor || "our doctor"}</b> has been cancelled.
    </p>

    <p>
      Please contact Dew Care Hospital to schedule another appointment.
    </p>

    <br>

    <b>Dew Care Hospital</b>
    `,
  });
};

module.exports = {
  sendHospitalEmail,
  sendPatientEmail,
  sendConfirmationEmail,
  sendCompletedEmail,
  sendCancelledEmail,
};