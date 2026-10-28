
const RESEND_API_URL = "https://api.resend.com/emails";

// ========================================
// HTML ESCAPE
// ========================================
const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const safe = (value, fallback = "N/A") =>
  escapeHtml(
    value === undefined || value === null || value === ""
      ? fallback
      : value
  );

// ========================================
// SENDER ADDRESS
// ========================================
const getFromAddress = () => {
  const from = process.env.EMAIL_FROM;

  if (!from) {
    throw new Error("EMAIL_FROM is missing.");
  }

  return from;
};

// ========================================
// COMMON EMAIL SENDER - RESEND API
// ========================================
const sendEmail = async (options) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing.");
  }

  if (
    !options ||
    !options.to ||
    !options.subject ||
    !options.html
  ) {
    throw new Error("Required email fields are missing.");
  }

  const from = options.from || getFromAddress();

  const recipients = Array.isArray(options.to)
    ? options.to
    : [options.to];

  if (
    recipients.length === 0 ||
    recipients.some(
      (recipient) =>
        typeof recipient !== "string" ||
        !recipient.trim()
    )
  ) {
    throw new Error("A valid email recipient is required.");
  }

  const payload = {
    from,
    to: recipients,
    subject: options.subject,
    html: options.html,
  };

  // Preserve optional plain-text content and reply-to settings.
  if (options.text) {
    payload.text = options.text;
  }

  if (options.replyTo || options.reply_to) {
    payload.reply_to = options.replyTo || options.reply_to;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Resend API error:", {
        status: response.status,
        message:
          result.message ||
          result.name ||
          "Email request failed",
      });

      throw new Error(
        `Resend API failed with HTTP ${response.status}`
      );
    }

    console.log("Email accepted by Resend:", {
      id: result.id,
      to: recipients,
    });

    return result;
  } catch (error) {
    console.error("Dew Care email error:", error.message);
    throw error;
  }
};

// ========================================
// APPOINTMENT DETAILS TABLE
// ========================================
const getAppointmentDetails = (appointment) => `
  <table
    cellpadding="10"
    cellspacing="0"
    border="1"
    style="border-collapse:collapse;width:100%;max-width:600px;border-color:#ddd"
  >
    <tr>
      <td><b>Patient Name</b></td>
      <td>${safe(appointment.name)}</td>
    </tr>
    <tr>
      <td><b>Phone</b></td>
      <td>${safe(appointment.phone)}</td>
    </tr>
    <tr>
      <td><b>Email</b></td>
      <td>${safe(appointment.email)}</td>
    </tr>
    <tr>
      <td><b>Department</b></td>
      <td>${safe(appointment.department)}</td>
    </tr>
    <tr>
      <td><b>Date</b></td>
      <td>${safe(appointment.date)}</td>
    </tr>
    <tr>
      <td><b>Time</b></td>
      <td>${safe(appointment.time)}</td>
    </tr>
    <tr>
      <td><b>Doctor</b></td>
      <td>${safe(appointment.doctor)}</td>
    </tr>
  </table>
`;

// ========================================
// COMMON EMAIL LAYOUT
// ========================================
const getEmailLayout = (title, content) => `
  <div style="font-family:Arial,sans-serif;color:#172d27;line-height:1.6;max-width:650px;margin:0 auto;padding:20px">
    <div style="background:#071c19;color:#fff;padding:22px;text-align:center">
      <h2 style="margin:0">Dew Care Hospital</h2>
      <p style="margin:6px 0 0;color:#e7d49b">
        Hospital &amp; Research Centre
      </p>
    </div>

    <div style="padding:24px;background:#fff;border:1px solid #eee">
      <h2>${escapeHtml(title)}</h2>
      ${content}
    </div>

    <div style="padding:16px;text-align:center;background:#f7f6ef;color:#555;font-size:12px">
      Dew Care Hospital &amp; Research Centre
      <br />
      Dhing Road, Haibargaon, Nagaon, Assam 782002
    </div>
  </div>
`;

// ========================================
// 1. HOSPITAL NOTIFICATION
// ========================================
const sendHospitalEmail = async (appointment) => {
  if (!process.env.HOSPITAL_EMAIL) {
    throw new Error("HOSPITAL_EMAIL is missing.");
  }

  const content = `
    <p>A new appointment request has been received.</p>

    ${getAppointmentDetails(appointment)}

    <h3>Additional Information</h3>
    <p><b>Age:</b> ${safe(appointment.age)}</p>
    <p><b>Gender:</b> ${safe(appointment.gender)}</p>
    <p><b>Problem:</b> ${safe(appointment.message)}</p>

    <p>Please review the request in the hospital admin panel.</p>
  `;

  return sendEmail({
    from: getFromAddress(),
    to: process.env.HOSPITAL_EMAIL,
    subject: "New Appointment Request - Dew Care Hospital",
    html: getEmailLayout("New Appointment Request", content),
  });
};

// ========================================
// 2. PATIENT BOOKING RECEIVED EMAIL
// ========================================
const sendPatientEmail = async (appointment) => {
  if (!appointment.email) return null;

  const content = `
    <p>Dear <b>${safe(appointment.name, "Patient")}</b>,</p>

    <p>
      Thank you for choosing Dew Care Hospital.
      We have successfully received your appointment request.
    </p>

    ${getAppointmentDetails(appointment)}

    <p>
      Our team will review your request and contact you shortly.
      This email confirms receipt of your request, not final appointment
      confirmation.
    </p>

    <p>Regards,<br /><b>Dew Care Hospital</b></p>
  `;

  return sendEmail({
    from: getFromAddress(),
    to: appointment.email,
    subject: "Appointment Request Received - Dew Care Hospital",
    html: getEmailLayout("Appointment Request Received", content),
  });
};

// ========================================
// 3. APPOINTMENT CONFIRMATION EMAIL
// ========================================
const sendConfirmationEmail = async (appointment) => {
  if (!appointment.email) return null;

  const content = `
    <p>Dear <b>${safe(appointment.name, "Patient")}</b>,</p>

    <p style="color:#16a34a;font-weight:bold">
      Your appointment has been confirmed successfully.
    </p>

    ${getAppointmentDetails(appointment)}

    <p>Please arrive 15 minutes before your appointment.</p>

    <p>Regards,<br /><b>Dew Care Hospital</b></p>
  `;

  return sendEmail({
    from: getFromAddress(),
    to: appointment.email,
    subject: "Appointment Confirmed - Dew Care Hospital",
    html: getEmailLayout("Appointment Confirmed", content),
  });
};

// ========================================
// 4. APPOINTMENT COMPLETED EMAIL
// ========================================
const sendCompletedEmail = async (appointment) => {
  if (!appointment.email) return null;

  const content = `
    <p>Dear <b>${safe(appointment.name, "Patient")}</b>,</p>

    <p>
      Your appointment with
      <b>${safe(appointment.doctor, "our doctor")}</b>
      has been completed successfully.
    </p>

    <p>
      Thank you for visiting Dew Care Hospital.
      We wish you good health.
    </p>

    <p>Regards,<br /><b>Dew Care Hospital</b></p>
  `;

  return sendEmail({
    from: getFromAddress(),
    to: appointment.email,
    subject: "Appointment Completed - Dew Care Hospital",
    html: getEmailLayout("Thank You for Visiting Us", content),
  });
};

// ========================================
// 5. APPOINTMENT CANCELLED EMAIL
// ========================================
const sendCancelledEmail = async (appointment) => {
  if (!appointment.email) return null;

  const content = `
    <p>Dear <b>${safe(appointment.name, "Patient")}</b>,</p>

    <p style="color:#dc2626;font-weight:bold">
      Unfortunately, your appointment has been cancelled.
    </p>

    <p>
      Doctor:
      <b>${safe(appointment.doctor, "our doctor")}</b>
    </p>

    ${getAppointmentDetails(appointment)}

    <p>
      Please contact Dew Care Hospital if you would like to schedule
      another appointment.
    </p>

    <p>Regards,<br /><b>Dew Care Hospital</b></p>
  `;

  return sendEmail({
    from: getFromAddress(),
    to: appointment.email,
    subject: "Appointment Cancelled - Dew Care Hospital",
    html: getEmailLayout("Appointment Cancelled", content),
  });
};

// ========================================
// EXPORT ALL FUNCTIONS
// ========================================
module.exports = {
  sendHospitalEmail,
  sendPatientEmail,
  sendConfirmationEmail,
  sendCompletedEmail,
  sendCancelledEmail,
};
