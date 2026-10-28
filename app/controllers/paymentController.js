
const crypto = require("crypto");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");

const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

// Standard API response
const sendResponse = (
  res,
  statusCode,
  status,
  message,
  data = null
) => {
  return res.status(statusCode).json({
    _status: status,
    _message: message,
    _data: data,
  });
};

// Timing helper
const logTiming = (label, startTime) => {
  console.log(
    `[PAYMENT TIMING] ${label}: ${Date.now() - startTime} ms`
  );
};

// Razorpay client
const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay environment variables are missing."
    );
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
// Fee comes from the Doctor database record.
// ========================================
exports.createAppointmentOrder = async (req, res) => {
  const requestStart = Date.now();

  try {
    const { appointmentId } = req.body || {};

    if (
      !appointmentId ||
      !mongoose.Types.ObjectId.isValid(appointmentId)
    ) {
      return sendResponse(
        res,
        400,
        false,
        "A valid appointment ID is required."
      );
    }

    // STEP 1: Fetch appointment
    const dbFetchStart = Date.now();

    const appointment = await Appointment.findById(
      appointmentId
    );

    logTiming("Appointment DB fetch", dbFetchStart);

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
        "Appointment details are incomplete."
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

    // STEP 2: Fetch doctor and use database OPD fee
    const doctorFetchStart = Date.now();

    const doctor = await Doctor.findById(
      appointment.doctorId
    );

    logTiming("Doctor DB fetch", doctorFetchStart);

    if (!doctor) {
      return sendResponse(
        res,
        404,
        false,
        "Doctor linked to this appointment was not found."
      );
    }

    if (doctor.status !== "Active") {
      return sendResponse(
        res,
        400,
        false,
        "This doctor is currently unavailable for appointments."
      );
    }

    if (doctor.opdAvailable !== true) {
      return sendResponse(
        res,
        400,
        false,
        "This doctor is not available for OPD appointments."
      );
    }

    const doctorFee = Number(doctor.opdFee);

    if (
      !Number.isFinite(doctorFee) ||
      doctorFee <= 0
    ) {
      return sendResponse(
        res,
        400,
        false,
        "This doctor's OPD fee is zero or invalid. Please contact the hospital."
      );
    }

    // Use the current fee from the database.
    // Never accept the fee from the frontend.
    const amountInPaise = Math.round(doctorFee * 100);

    if (
      !Number.isSafeInteger(amountInPaise) ||
      amountInPaise <= 0
    ) {
      return sendResponse(
        res,
        400,
        false,
        "The doctor's OPD fee is invalid."
      );
    }

    const { client, keyId } = getRazorpay();

    // STEP 3: Create Razorpay order
    const razorpayStart = Date.now();

    const order = await client.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `apt_${appointment._id.toString()}`.slice(
        0,
        40
      ),
      notes: {
        appointmentId: appointment._id.toString(),
        doctorId: doctor._id.toString(),
        doctorName: String(doctor.name),
        patientName: String(appointment.name),
      },
    });

    logTiming("Razorpay order creation", razorpayStart);

    // STEP 4: Save order and the exact fee charged
    appointment.razorpayOrderId = order.id;
    appointment.paymentAmount = doctorFee;
    appointment.paymentStatus = "Pending";
    appointment.status = "Pending Payment";

    const dbSaveStart = Date.now();

    await appointment.save();

    logTiming("Appointment DB save", dbSaveStart);

    console.log(
      `[PAYMENT TIMING] Total create-order handler: ${
        Date.now() - requestStart
      } ms`
    );

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
        amountInRupees: doctorFee,
        currency: order.currency,
        patient: {
          name: appointment.name,
          phone: appointment.phone,
          email: appointment.email || "",
        },
        doctor: doctor.name,
        doctorId: doctor._id,
        department: appointment.department,
        appointmentDate: appointment.date,
        appointmentTime: appointment.time,
      }
    );
 
  } catch (error) {
    console.error("Create appointment order error:", {
      message: error?.message || String(error),
      name: error?.name,
      statusCode: error?.statusCode,
      code: error?.code,
      description: error?.error?.description,
      razorpayError: error?.error,
      stack: error?.stack,
    });

    console.log(
      `[PAYMENT TIMING] Failed create-order handler: ${
        Date.now() - requestStart
      } ms`
    );

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
  const requestStart = Date.now();

  try {
    const {
      appointmentId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

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

    const dbFetchStart = Date.now();

    const appointment = await Appointment.findById(
      appointmentId
    );

    logTiming("Verify: Appointment DB fetch", dbFetchStart);

    if (!appointment) {
      return sendResponse(
        res,
        404,
        false,
        "Appointment not found."
      );
    }

    if (
      appointment.razorpayOrderId !== razorpay_order_id
    ) {
      return sendResponse(
        res,
        400,
        false,
        "Payment order does not match this appointment."
      );
    }

    // Idempotency: already verified payment
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

    // Verify signature on the server
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    const received = Buffer.from(
      razorpay_signature,
      "hex"
    );
    const expected = Buffer.from(
      expectedSignature,
      "hex"
    );

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

    // Confirm payment directly with Razorpay
    const razorpayVerifyStart = Date.now();

    const payment = await client.payments.fetch(
      razorpay_payment_id
    );

    logTiming(
      "Verify: Razorpay payment fetch",
      razorpayVerifyStart
    );

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

    // Verify against the amount saved when the order was created
    const expectedAmount = Math.round(
      Number(appointment.paymentAmount) * 100
    );

    if (
      !Number.isSafeInteger(expectedAmount) ||
      expectedAmount <= 0 ||
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

    // Mark appointment paid only after successful verification
    appointment.paymentStatus = "Paid";
    appointment.status = "Confirmed";
    appointment.razorpayPaymentId = razorpay_payment_id;
    appointment.paidAt = new Date();

    const dbSaveStart = Date.now();

    await appointment.save();

    logTiming("Verify: Appointment DB save", dbSaveStart);

    console.log(
      `[PAYMENT TIMING] Total verify handler: ${
        Date.now() - requestStart
      } ms`
    );

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
    console.error(
      "Verify appointment payment error:",
      error.message
    );

    console.log(
      `[PAYMENT TIMING] Failed verify handler: ${
        Date.now() - requestStart
      } ms`
    );

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
    const {
      appointmentId,
      razorpay_order_id,
      reason,
    } = req.body || {};

    if (
      !appointmentId ||
      !mongoose.Types.ObjectId.isValid(appointmentId)
    ) {
      return sendResponse(
        res,
        400,
        false,
        "A valid appointment ID is required."
      );
    }

    const appointment = await Appointment.findById(
      appointmentId
    );

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

    if (
      reason &&
      appointment.schema.path("paymentFailureReason")
    ) {
      appointment.paymentFailureReason = String(
        reason
      ).slice(0, 500);
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
    console.error(
      "Mark appointment payment failed error:",
      error.message
    );

    return sendResponse(
      res,
      500,
      false,
      "Unable to update payment status."
    );
  }
};
