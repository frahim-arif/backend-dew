
const crypto = require("crypto");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");

const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

const {
  writePaymentAudit,
} = require("../utils/paymentAudit");

// ========================================
// STANDARD API RESPONSE
// ========================================
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

// ========================================
// TIMING HELPER
// ========================================
const logTiming = (label, startTime) => {
  console.log(
    `[PAYMENT TIMING] ${label}: ${Date.now() - startTime} ms`
  );
};

// ========================================
// AUDIT HELPER
// ========================================
const audit = async (data) => {
  return writePaymentAudit(data);
};

// ========================================
// RAZORPAY CLIENT
// ========================================
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
// ========================================
exports.createAppointmentOrder = async (req, res) => {
  const requestStart = Date.now();
  let auditAppointmentId = null;

  try {
    const { appointmentId } = req.body || {};

    if (
      !appointmentId ||
      !mongoose.Types.ObjectId.isValid(appointmentId)
    ) {
      await audit({
        event: "ORDER_CREATE_VALIDATION_FAILED",
        status: "REJECTED",
        error: "Invalid or missing appointment ID",
        request: {
          appointmentId: appointmentId || null,
        },
      });

      return sendResponse(
        res,
        400,
        false,
        "A valid appointment ID is required."
      );
    }

    // STEP 1: FETCH APPOINTMENT
    const dbFetchStart = Date.now();

    const appointment = await Appointment.findById(
      appointmentId
    );

    logTiming("Appointment DB fetch", dbFetchStart);

    if (!appointment) {
      await audit({
        event: "ORDER_CREATE_VALIDATION_FAILED",
        status: "REJECTED",
        error: "Appointment not found",
        request: { appointmentId },
      });

      return sendResponse(
        res,
        404,
        false,
        "Appointment not found."
      );
    }

    auditAppointmentId = appointment._id;

    if (
      !appointment.name ||
      !appointment.phone ||
      !appointment.department ||
      !appointment.date ||
      !appointment.doctor ||
      !appointment.doctorId
    ) {
      await audit({
        appointmentId: appointment._id,
        event: "ORDER_CREATE_VALIDATION_FAILED",
        status: "REJECTED",
        error: "Appointment details are incomplete",
      });

      return sendResponse(
        res,
        400,
        false,
        "Appointment details are incomplete."
      );
    }

    if (appointment.paymentStatus === "Paid") {
      await audit({
        appointmentId: appointment._id,
        event: "DUPLICATE_ORDER_REQUEST",
        orderId: appointment.razorpayOrderId,
        paymentId: appointment.razorpayPaymentId,
        status: "REJECTED",
        error: "Appointment is already paid",
      });

      return sendResponse(
        res,
        409,
        false,
        "Payment for this appointment is already completed."
      );
    }

    // STEP 2: FETCH DOCTOR
    const doctorFetchStart = Date.now();

    const doctor = await Doctor.findById(
      appointment.doctorId
    );

    logTiming("Doctor DB fetch", doctorFetchStart);

    if (!doctor) {
      await audit({
        appointmentId: appointment._id,
        event: "ORDER_CREATE_VALIDATION_FAILED",
        status: "REJECTED",
        error: "Doctor not found",
      });

      return sendResponse(
        res,
        404,
        false,
        "Doctor linked to this appointment was not found."
      );
    }

    if (doctor.status !== "Active") {
      await audit({
        appointmentId: appointment._id,
        event: "ORDER_CREATE_VALIDATION_FAILED",
        status: "REJECTED",
        error: "Doctor is inactive",
      });

      return sendResponse(
        res,
        400,
        false,
        "This doctor is currently unavailable for appointments."
      );
    }

    if (doctor.opdAvailable !== true) {
      await audit({
        appointmentId: appointment._id,
        event: "ORDER_CREATE_VALIDATION_FAILED",
        status: "REJECTED",
        error: "Doctor OPD is unavailable",
      });

      return sendResponse(
        res,
        400,
        false,
        "This doctor is not available for OPD appointments."
      );
    }

    // STEP 3: GET FEE FROM DATABASE
    const doctorFee = Number(doctor.opdFee);

    if (
      !Number.isFinite(doctorFee) ||
      doctorFee <= 0
    ) {
      await audit({
        appointmentId: appointment._id,
        event: "ORDER_CREATE_VALIDATION_FAILED",
        status: "REJECTED",
        error: "Invalid doctor OPD fee",
      });

      return sendResponse(
        res,
        400,
        false,
        "This doctor's OPD fee is zero or invalid. Please contact the hospital."
      );
    }

    const amountInPaise = Math.round(
      doctorFee * 100
    );

    if (
      !Number.isSafeInteger(amountInPaise) ||
      amountInPaise <= 0
    ) {
      await audit({
        appointmentId: appointment._id,
        event: "ORDER_CREATE_VALIDATION_FAILED",
        status: "REJECTED",
        error: "Invalid payment amount",
      });

      return sendResponse(
        res,
        400,
        false,
        "The doctor's OPD fee is invalid."
      );
    }

    const { client, keyId } = getRazorpay();

    const receipt = `apt_${appointment._id.toString()}`.slice(
      0,
      40
    );

    const orderRequest = {
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        appointmentId: appointment._id.toString(),
        doctorId: doctor._id.toString(),
        doctorName: String(doctor.name),
      },
    };

    // STEP 4: LOG ORDER REQUEST
    await audit({
      appointmentId: appointment._id,
      event: "RAZORPAY_ORDER_CREATE_REQUEST",
      amountPaise: amountInPaise,
      currency: "INR",
      status: "REQUESTED",
      request: orderRequest,
    });

    // STEP 5: CREATE RAZORPAY ORDER
    const razorpayStart = Date.now();

    const order = await client.orders.create(
      orderRequest
    );

    logTiming(
      "Razorpay order creation",
      razorpayStart
    );

    // STEP 6: LOG RAZORPAY RESPONSE
    await audit({
      appointmentId: appointment._id,
      event: "RAZORPAY_ORDER_CREATE_RESPONSE",
      orderId: order.id,
      amountPaise: order.amount,
      currency: order.currency,
      status: "SUCCESS",
      response: {
        id: order.id,
        entity: order.entity,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        receipt: order.receipt,
        created_at: order.created_at,
      },
    });

    // STEP 7: SAVE ORDER IN DATABASE
    appointment.razorpayOrderId = order.id;
    appointment.paymentAmount = doctorFee;
    appointment.paymentStatus = "Pending";
    appointment.paymentFailureReason = "";
    appointment.status = "Pending Payment";

    const dbSaveStart = Date.now();

    await appointment.save();

    logTiming(
      "Appointment DB save",
      dbSaveStart
    );

    // STEP 8: DATABASE AUDIT
    await audit({
      appointmentId: appointment._id,
      event: "APPOINTMENT_PAYMENT_PENDING_DB",
      orderId: order.id,
      amountPaise: order.amount,
      currency: order.currency,
      status: "DB_SAVED",
      response: {
        paymentStatus: appointment.paymentStatus,
        appointmentStatus: appointment.status,
        paymentAmount: appointment.paymentAmount,
      },
    });

    console.log(
      `[PAYMENT TIMING] Total create-order handler: ${
        Date.now() - requestStart
      } ms`
    );

    // STEP 9: SUCCESS RESPONSE
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
    console.error(
      "Create appointment order error:",
      {
        message: error?.message,
        name: error?.name,
        statusCode: error?.statusCode,
        code: error?.code,
        description: error?.error?.description,
      }
    );

    await audit({
      appointmentId: auditAppointmentId,
      event: "RAZORPAY_ORDER_CREATE_ERROR",
      status: "FAILED",
      error: error?.message || "Order creation failed",
      response: {
        errorName: error?.name || "",
        errorCode: error?.code || "",
        statusCode: error?.statusCode || null,
      },
    });

    logTiming(
      "Failed create-order handler",
      requestStart
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
  let auditAppointmentId = null;
  let auditOrderId = "";
  let auditPaymentId = "";

  try {
    const {
      appointmentId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

    auditOrderId = razorpay_order_id || "";
    auditPaymentId = razorpay_payment_id || "";

    if (
      !appointmentId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      await audit({
        event: "PAYMENT_VERIFICATION_VALIDATION_FAILED",
        orderId: auditOrderId,
        paymentId: auditPaymentId,
        status: "REJECTED",
        error: "Required verification details are missing",
        request: {
          appointmentId: appointmentId || null,
          orderIdProvided: Boolean(razorpay_order_id),
          paymentIdProvided: Boolean(razorpay_payment_id),
          signatureProvided: Boolean(razorpay_signature),
        },
      });

      return sendResponse(
        res,
        400,
        false,
        "Required payment verification details are missing."
      );
    }

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      await audit({
        event: "PAYMENT_VERIFICATION_VALIDATION_FAILED",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        status: "REJECTED",
        error: "Invalid appointment ID",
      });

      return sendResponse(
        res,
        400,
        false,
        "Invalid appointment ID."
      );
    }

    const { client, keySecret } = getRazorpay();

    // STEP 1: FETCH APPOINTMENT
    const dbFetchStart = Date.now();

    const appointment = await Appointment.findById(
      appointmentId
    );

    logTiming(
      "Verify: Appointment DB fetch",
      dbFetchStart
    );

    if (!appointment) {
      await audit({
        event: "PAYMENT_VERIFICATION_FAILED",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        status: "REJECTED",
        error: "Appointment not found",
      });

      return sendResponse(
        res,
        404,
        false,
        "Appointment not found."
      );
    }

    auditAppointmentId = appointment._id;

    // STEP 2: LOG VERIFICATION REQUEST
    await audit({
      appointmentId: appointment._id,
      event: "PAYMENT_VERIFICATION_REQUEST",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      status: "REQUESTED",
      request: {
        appointmentId: appointment._id.toString(),
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signatureProvided: true,
      },
    });

    // STEP 3: MATCH ORDER
    if (
      appointment.razorpayOrderId !== razorpay_order_id
    ) {
      await audit({
        appointmentId: appointment._id,
        event: "PAYMENT_ORDER_MISMATCH",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        status: "REJECTED",
        error: "Payment order does not match appointment",
        verification: {
          orderMatched: false,
        },
      });

      return sendResponse(
        res,
        400,
        false,
        "Payment order does not match this appointment."
      );
    }

    // STEP 4: IDEMPOTENCY
    if (
      appointment.paymentStatus === "Paid" &&
      appointment.razorpayPaymentId === razorpay_payment_id
    ) {
      await audit({
        appointmentId: appointment._id,
        event: "PAYMENT_ALREADY_VERIFIED",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        status: "VERIFIED",
        verification: {
          alreadyPaid: true,
        },
      });

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
      await audit({
        appointmentId: appointment._id,
        event: "DUPLICATE_PAYMENT_REJECTED",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        status: "REJECTED",
        error: "Another payment is already recorded",
      });

      return sendResponse(
        res,
        409,
        false,
        "This appointment has already been paid using another payment."
      );
    }

    // STEP 5: VERIFY HMAC SIGNATURE
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

    const signatureValid =
      received.length === expected.length &&
      crypto.timingSafeEqual(received, expected);

    if (!signatureValid) {
      await audit({
        appointmentId: appointment._id,
        event: "PAYMENT_SIGNATURE_VERIFICATION",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        status: "REJECTED",
        verification: {
          signatureValid: false,
          verificationMethod: "HMAC-SHA256",
        },
        error: "Invalid payment signature",
      });

      return sendResponse(
        res,
        400,
        false,
        "Invalid payment signature."
      );
    }

    await audit({
      appointmentId: appointment._id,
      event: "PAYMENT_SIGNATURE_VERIFICATION",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      status: "VERIFIED",
      verification: {
        signatureValid: true,
        verificationMethod: "HMAC-SHA256",
      },
    });

    // STEP 6: FETCH ACTUAL PAYMENT FROM RAZORPAY
    const razorpayVerifyStart = Date.now();

    const payment = await client.payments.fetch(
      razorpay_payment_id
    );

    logTiming(
      "Verify: Razorpay payment fetch",
      razorpayVerifyStart
    );

    await audit({
      appointmentId: appointment._id,
      event: "RAZORPAY_PAYMENT_FETCH_RESPONSE",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amountPaise: payment.amount,
      currency: payment.currency,
      status:
        payment.status === "captured"
          ? "SUCCESS"
          : "FAILED",
      response: {
        id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        captured: payment.captured,
        method: payment.method,
      },
    });

    // STEP 7: VERIFY RAZORPAY ORDER ID
    if (payment.order_id !== razorpay_order_id) {
      await audit({
        appointmentId: appointment._id,
        event: "PAYMENT_ORDER_VERIFICATION_FAILED",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        status: "REJECTED",
        error: "Razorpay payment order ID mismatch",
        verification: {
          orderMatched: false,
        },
      });

      return sendResponse(
        res,
        400,
        false,
        "Payment order verification failed."
      );
    }

    // STEP 8: VERIFY CAPTURED STATUS
    if (payment.status !== "captured") {
      await audit({
        appointmentId: appointment._id,
        event: "PAYMENT_CAPTURE_VERIFICATION_FAILED",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amountPaise: payment.amount,
        currency: payment.currency,
        status: "REJECTED",
        error: `Payment status is ${payment.status}`,
        verification: {
          paymentCaptured: false,
        },
      });

      return sendResponse(
        res,
        400,
        false,
        "Payment has not been captured yet."
      );
    }

    // STEP 9: VERIFY AMOUNT AND CURRENCY
    const expectedAmount = Math.round(
      Number(appointment.paymentAmount) * 100
    );

    if (
      !Number.isSafeInteger(expectedAmount) ||
      expectedAmount <= 0 ||
      payment.amount !== expectedAmount ||
      payment.currency !== "INR"
    ) {
      await audit({
        appointmentId: appointment._id,
        event: "PAYMENT_AMOUNT_VERIFICATION_FAILED",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amountPaise: payment.amount,
        currency: payment.currency,
        status: "REJECTED",
        error: "Payment amount or currency mismatch",
        verification: {
          expectedAmountPaise: expectedAmount,
          receivedAmountPaise: payment.amount,
          expectedCurrency: "INR",
          receivedCurrency: payment.currency,
          amountMatched: payment.amount === expectedAmount,
          currencyMatched: payment.currency === "INR",
        },
      });

      return sendResponse(
        res,
        400,
        false,
        "Payment amount or currency does not match."
      );
    }

    // STEP 10: FINAL VERIFICATION LOG
    await audit({
      appointmentId: appointment._id,
      event: "PAYMENT_FINAL_VERIFICATION",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amountPaise: payment.amount,
      currency: payment.currency,
      status: "VERIFIED",
      verification: {
        signatureValid: true,
        orderMatched: true,
        amountMatched: true,
        currencyMatched: true,
        paymentCaptured: true,
      },
    });

    // STEP 11: UPDATE DATABASE
    appointment.paymentStatus = "Paid";
    appointment.status = "Confirmed";
    appointment.razorpayPaymentId = razorpay_payment_id;
    appointment.paidAt = new Date();
    appointment.paymentFailureReason = "";

    const dbSaveStart = Date.now();

    await appointment.save();

    logTiming(
      "Verify: Appointment DB save",
      dbSaveStart
    );

    // STEP 12: DATABASE CONFIRMATION LOG
    await audit({
      appointmentId: appointment._id,
      event: "PAYMENT_SUCCESS_DATABASE_UPDATE",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amountPaise: payment.amount,
      currency: payment.currency,
      status: "DB_SAVED",
      response: {
        paymentStatus: appointment.paymentStatus,
        appointmentStatus: appointment.status,
        paidAt: appointment.paidAt,
      },
    });

    console.log(
      `[PAYMENT TIMING] Total verify handler: ${
        Date.now() - requestStart
      } ms`
    );

    // STEP 13: SUCCESS RESPONSE
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

    await audit({
      appointmentId: auditAppointmentId,
      event: "PAYMENT_VERIFICATION_ERROR",
      orderId: auditOrderId,
      paymentId: auditPaymentId,
      status: "FAILED",
      error: error?.message || "Payment verification failed",
    });

    logTiming(
      "Failed verify handler",
      requestStart
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
  let auditAppointmentId = null;

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
      await audit({
        event: "PAYMENT_FAILURE_VALIDATION_FAILED",
        status: "REJECTED",
        error: "Invalid appointment ID",
      });

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
      await audit({
        event: "PAYMENT_FAILURE_VALIDATION_FAILED",
        status: "REJECTED",
        error: "Appointment not found",
      });

      return sendResponse(
        res,
        404,
        false,
        "Appointment not found."
      );
    }

    auditAppointmentId = appointment._id;

    if (appointment.paymentStatus === "Paid") {
      await audit({
        appointmentId: appointment._id,
        event: "PAYMENT_FAILURE_REJECTED_ALREADY_PAID",
        orderId: appointment.razorpayOrderId,
        paymentId: appointment.razorpayPaymentId,
        status: "REJECTED",
        error: "Appointment is already paid",
      });

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
      await audit({
        appointmentId: appointment._id,
        event: "PAYMENT_FAILURE_ORDER_MISMATCH",
        orderId: razorpay_order_id,
        status: "REJECTED",
        error: "Payment order does not match appointment",
      });

      return sendResponse(
        res,
        400,
        false,
        "Payment order does not match this appointment."
      );
    }

    // UPDATE FAILURE STATUS
    appointment.paymentStatus = "Failed";
    appointment.status = "Pending Payment";

    appointment.paymentFailureReason = String(
      reason || "Payment failed or cancelled by customer"
    ).slice(0, 500);

    await appointment.save();

    // LOG FAILURE DATABASE UPDATE
    await audit({
      appointmentId: appointment._id,
      event: "PAYMENT_FAILURE_DATABASE_UPDATE",
      orderId: appointment.razorpayOrderId,
      status: "FAILED",
      error: appointment.paymentFailureReason,
      response: {
        paymentStatus: appointment.paymentStatus,
        appointmentStatus: appointment.status,
      },
    });

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

    await audit({
      appointmentId: auditAppointmentId,
      event: "PAYMENT_FAILURE_UPDATE_ERROR",
      status: "FAILED",
      error: error?.message || "Unable to update payment status",
    });

    return sendResponse(
      res,
      500,
      false,
      "Unable to update payment status."
    );
  }
};
