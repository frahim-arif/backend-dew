
const crypto = require("crypto");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const Appointment = require("../models/Appointment");

const APPOINTMENT_FEE = Number(process.env.APPOINTMENT_FEE || 500);

const sendResponse = (res, statusCode, status, message, data = null) => {
  return res.status(statusCode).json({
    _status: status,
    _message: message,
    _data: data,
  });
};

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay environment variables are missing.");
  }

  return {
    client: new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    }),
    keyId,
    keySecret,
  };
};

// ========================================
// CREATE APPOINTMENT PAYMENT ORDER
// ========================================
exports.createAppointmentOrder = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return sendResponse(
        res,
        400,
        false,
        "Appointment ID is required."
      );
    }

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return sendResponse(
        res,
        400,
        false,
        "Invalid appointment ID."
      );
    }

    if (!Number.isFinite(APPOINTMENT_FEE) || APPOINTMENT_FEE <= 0) {
      return sendResponse(
        res,
        500,
        false,
        "Appointment fee is not configured correctly."
      );
    }

    // Use the appointment already created by the appointments API.
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return sendResponse(
        res,
        404,
        false,
        "Appointment not found."
      );
    }

    if (
      !appointment.name ||
      !appointment.phone ||
      !appointment.department ||
      !appointment.date ||
      !appointment.doctor ||
      !appointment.doctorId
    ) {
      return sendResponse(
        res,
        400,
        false,
        "Appointment details are incomplete. Please submit the appointment again."
      );
    }

    if (appointment.paymentStatus === "Paid") {
      return sendResponse(
        res,
        409,
        false,
        "Payment for this appointment is already completed."
      );
    }

    const { client, keyId } = getRazorpay();

    // Razorpay amount must be in paise.
    const amountInPaise = Math.round(APPOINTMENT_FEE * 100);

    const order = await client.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `apt_${appointment._id.toString()}`.slice(0, 40),
      notes: {
        appointmentId: appointment._id.toString(),
        patientName: String(appointment.name),
        department: String(appointment.department),
      },
    });

    // Update the existing appointment; do not create another one.
    appointment.razorpayOrderId = order.id;
    appointment.paymentAmount = APPOINTMENT_FEE;
    appointment.paymentStatus = "Pending";
    appointment.status = "Pending Payment";

    await appointment.save();

    return sendResponse(
      res,
      200,
      true,
      "Payment order created successfully.",
      {
        appointmentId: appointment._id,
        orderId: order.id,
        keyId,
        amount: order.amount,
        amountInRupees: APPOINTMENT_FEE,
        currency: order.currency,
        patient: {
          name: appointment.name,
          phone: appointment.phone,
          email: appointment.email || "",
        },
        doctor: appointment.doctor,
        doctorId: appointment.doctorId,
        department: appointment.department,
        appointmentDate: appointment.date,
        appointmentTime: appointment.time,
      }
    );
  } catch (error) {
    console.error("Create appointment order error:", error);

    return sendResponse(
      res,
      500,
      false,
      "Unable to create payment order. Please try again."
    );
  }
};

// ========================================
// VERIFY APPOINTMENT PAYMENT
// ========================================
exports.verifyAppointmentPayment = async (req, res) => {
  try {
    const {
      appointmentId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !appointmentId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return sendResponse(
        res,
        400,
        false,
        "Required payment verification details are missing."
      );
    }

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return sendResponse(
        res,
        400,
        false,
        "Invalid appointment ID."
      );
    }

    const { client, keySecret } = getRazorpay();

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return sendResponse(
        res,
        404,
        false,
        "Appointment not found."
      );
    }

    // The order must belong to this appointment.
    if (appointment.razorpayOrderId !== razorpay_order_id) {
      return sendResponse(
        res,
        400,
        false,
        "Payment order does not match this appointment."
      );
    }

    // Idempotency: do not process an already verified payment again.
    if (
      appointment.paymentStatus === "Paid" &&
      appointment.razorpayPaymentId === razorpay_payment_id
    ) {
      return sendResponse(
        res,
        200,
        true,
        "Payment has already been verified.",
        {
          appointmentId: appointment._id,
          paymentId: appointment.razorpayPaymentId,
          paymentStatus: appointment.paymentStatus,
          status: appointment.status,
        }
      );
    }

    if (appointment.paymentStatus === "Paid") {
      return sendResponse(
        res,
        409,
        false,
        "This appointment has already been paid using another payment."
      );
    }

    // Verify Razorpay signature using the server-side secret.
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const received = Buffer.from(razorpay_signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      return sendResponse(
        res,
        400,
        false,
        "Invalid payment signature."
      );
    }

    // Verify payment details directly with Razorpay.
    const payment = await client.payments.fetch(razorpay_payment_id);

    if (payment.order_id !== razorpay_order_id) {
      return sendResponse(
        res,
        400,
        false,
        "Payment order verification failed."
      );
    }

    if (payment.status !== "captured") {
      return sendResponse(
        res,
        400,
        false,
        "Payment has not been captured yet."
      );
    }

    const expectedAmount = Math.round(
      Number(appointment.paymentAmount || APPOINTMENT_FEE) * 100
    );

    if (
      payment.amount !== expectedAmount ||
      payment.currency !== "INR"
    ) {
      return sendResponse(
        res,
        400,
        false,
        "Payment amount or currency does not match."
      );
    }

    // Mark appointment paid only after all checks pass.
    appointment.paymentStatus = "Paid";
    appointment.status = "Confirmed";
    appointment.razorpayPaymentId = razorpay_payment_id;
    appointment.paidAt = new Date();

    await appointment.save();

    return sendResponse(
      res,
      200,
      true,
      "Payment verified successfully. Appointment confirmed.",
      {
        appointmentId: appointment._id,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount: payment.amount,
        currency: payment.currency,
        paymentStatus: appointment.paymentStatus,
        status: appointment.status,
      }
    );
  } catch (error) {
    console.error("Verify appointment payment error:", error);

    return sendResponse(
      res,
      500,
      false,
      "Unable to verify payment. Please contact the hospital if money was deducted."
    );
  }
};

// ========================================
// MARK APPOINTMENT PAYMENT FAILED
// ========================================
exports.markAppointmentPaymentFailed = async (req, res) => {
  try {
    const { appointmentId, razorpay_order_id, reason } = req.body;

    if (!appointmentId) {
      return sendResponse(
        res,
        400,
        false,
        "Appointment ID is required."
      );
    }

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return sendResponse(
        res,
        400,
        false,
        "Invalid appointment ID."
      );
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return sendResponse(
        res,
        404,
        false,
        "Appointment not found."
      );
    }

    if (appointment.paymentStatus === "Paid") {
      return sendResponse(
        res,
        409,
        false,
        "This appointment is already paid."
      );
    }

    if (
      razorpay_order_id &&
      appointment.razorpayOrderId !== razorpay_order_id
    ) {
      return sendResponse(
        res,
        400,
        false,
        "Payment order does not match this appointment."
      );
    }

    appointment.paymentStatus = "Failed";
    appointment.status = "Pending Payment";

    // Save a failure reason only if your Appointment schema supports it.
    if (reason && appointment.schema.path("paymentFailureReason")) {
      appointment.paymentFailureReason = String(reason).slice(0, 500);
    }

    await appointment.save();

    return sendResponse(
      res,
      200,
      true,
      "Payment failure status updated.",
      {
        appointmentId: appointment._id,
        paymentStatus: appointment.paymentStatus,
        status: appointment.status,
      }
    );
  } catch (error) {
    console.error("Mark appointment payment failed error:", error);

    return sendResponse(
      res,
      500,
      false,
      "Unable to update payment status."
    );
  }
};
