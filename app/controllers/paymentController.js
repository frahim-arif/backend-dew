const crypto = require("crypto");
const mongoose = require("mongoose");

const razorpay = require("../../config/razorpay");
const Appointment = require("../models/Appointment");

const APPOINTMENT_FEE = Number(
  process.env.APPOINTMENT_FEE || 500
);

/* =========================================================
   CREATE APPOINTMENT + RAZORPAY ORDER
   POST /api/payments/create-order
========================================================= */

exports.createAppointmentOrder = async (req, res) => {
  let appointment = null;

  try {
    const {
      name,
      phone,
      email,
      age,
      gender,
      department,
      date,
      doctor,
      doctorId,
      message,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Patient name is required.",
      });
    }

    if (!phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }

    if (!department?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Department is required.",
      });
    }

    if (!date?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Appointment date is required.",
      });
    }

    if (!doctor?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Doctor name is required.",
      });
    }

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required.",
      });
    }

    if (!mongoose.isValidObjectId(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID.",
      });
    }

    if (
      !Number.isFinite(APPOINTMENT_FEE) ||
      APPOINTMENT_FEE <= 0
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Appointment fee is not configured correctly.",
      });
    }

    const amountInPaise = Math.round(
      APPOINTMENT_FEE * 100
    );

    appointment = await Appointment.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || "",
      age: age ? String(age).trim() : "",
      gender: gender?.trim() || "",
      department: department.trim(),
      date: date.trim(),
      doctor: doctor.trim(),
      doctorId,
      message: message?.trim() || "",

      status: "Pending Payment",
      paymentStatus: "Pending",
      paymentAmount: APPOINTMENT_FEE,
    });

    const receipt = `apt_${appointment._id
      .toString()
      .slice(-18)}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,

      notes: {
        appointmentId: appointment._id.toString(),
        doctorId: appointment.doctorId.toString(),
        patientName: appointment.name,
        patientPhone: appointment.phone,
        doctor: appointment.doctor,
        appointmentDate: appointment.date,
      },
    });

    appointment.razorpayOrderId = razorpayOrder.id;
    await appointment.save();

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully.",

      data: {
        appointmentId: appointment._id,
        orderId: razorpayOrder.id,
        keyId: process.env.RAZORPAY_KEY_ID,

        amount: razorpayOrder.amount,
        amountInRupees: APPOINTMENT_FEE,
        currency: razorpayOrder.currency,

        patient: {
          name: appointment.name,
          phone: appointment.phone,
          email: appointment.email,
        },

        doctor: appointment.doctor,
        doctorId: appointment.doctorId,
        appointmentDate: appointment.date,
      },
    });
  } catch (error) {
    console.error(
      "Create Razorpay appointment order error:",
      error
    );

    if (
      appointment?._id &&
      !appointment.razorpayOrderId
    ) {
      await Appointment.findByIdAndDelete(
        appointment._id
      ).catch(() => {});
    }

    return res.status(500).json({
      success: false,
      message:
        error?.error?.description ||
        error?.message ||
        "Unable to create payment order.",
    });
  }
};

/* =========================================================
   VERIFY RAZORPAY PAYMENT
   POST /api/payments/verify
========================================================= */

exports.verifyAppointmentPayment = async (
  req,
  res
) => {
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
      return res.status(400).json({
        success: false,
        message:
          "Payment verification data is incomplete.",
      });
    }

    if (!mongoose.isValidObjectId(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    const appointment =
      await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    if (
      appointment.paymentStatus === "Paid" &&
      appointment.razorpayPaymentId ===
        razorpay_payment_id
    ) {
      return res.status(200).json({
        success: true,
        message: "Payment already verified.",

        data: {
          appointmentId: appointment._id,
          status: appointment.status,
          paymentStatus:
            appointment.paymentStatus,
          paymentId:
            appointment.razorpayPaymentId,
          orderId: appointment.razorpayOrderId,
        },
      });
    }

    if (
      appointment.razorpayOrderId !==
      razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order ID does not match.",
      });
    }

    const signatureBody =
      `${appointment.razorpayOrderId}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET.trim()
      )
      .update(signatureBody)
      .digest("hex");

    const expectedBuffer = Buffer.from(
      expectedSignature,
      "utf8"
    );

    const receivedBuffer = Buffer.from(
      razorpay_signature,
      "utf8"
    );

    const isValidSignature =
      expectedBuffer.length ===
        receivedBuffer.length &&
      crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      );

    if (!isValidSignature) {
      appointment.paymentStatus = "Failed";
      await appointment.save();

      return res.status(400).json({
        success: false,
        message:
          "Payment signature verification failed.",
      });
    }

    const payment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    if (
      payment.order_id !==
      appointment.razorpayOrderId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment order verification failed.",
      });
    }

    const expectedAmount = Math.round(
      Number(appointment.paymentAmount) * 100
    );

    if (Number(payment.amount) !== expectedAmount) {
      return res.status(400).json({
        success: false,
        message: "Payment amount does not match.",
      });
    }

    if (payment.currency !== "INR") {
      return res.status(400).json({
        success: false,
        message: "Payment currency does not match.",
      });
    }

    appointment.razorpayPaymentId =
      razorpay_payment_id;

    appointment.razorpaySignature =
      razorpay_signature;

    appointment.paymentStatus = "Paid";
    appointment.status = "Confirmed";
    appointment.paidAt = new Date();

    await appointment.save();

    return res.status(200).json({
      success: true,
      message:
        "Payment verified and appointment confirmed.",

      data: {
        appointmentId: appointment._id,
        status: appointment.status,
        paymentStatus:
          appointment.paymentStatus,
        paymentId:
          appointment.razorpayPaymentId,
        orderId: appointment.razorpayOrderId,
        amount: appointment.paymentAmount,
        paidAt: appointment.paidAt,
      },
    });
  } catch (error) {
    console.error(
      "Verify Razorpay payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.error?.description ||
        error?.message ||
        "Payment verification failed.",
    });
  }
};

/* =========================================================
   MARK PAYMENT FAILED
   POST /api/payments/failed
========================================================= */

exports.markAppointmentPaymentFailed = async (
  req,
  res
) => {
  try {
    const {
      appointmentId,
      razorpayOrderId,
      errorCode,
      errorDescription,
    } = req.body;

    if (
      !appointmentId ||
      !mongoose.isValidObjectId(appointmentId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid appointment ID is required.",
      });
    }

    const appointment =
      await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    if (
      razorpayOrderId &&
      appointment.razorpayOrderId !==
        razorpayOrderId
    ) {
      return res.status(400).json({
        success: false,
        message: "Order ID does not match.",
      });
    }

    if (appointment.paymentStatus !== "Paid") {
      appointment.paymentStatus = "Failed";
      appointment.status = "Pending Payment";

      appointment.message = [
        appointment.message,

        errorCode
          ? `Payment error code: ${errorCode}`
          : "",

        errorDescription
          ? `Payment error: ${errorDescription}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      await appointment.save();
    }

    return res.status(200).json({
      success: true,
      message:
        "Failed payment status recorded.",
    });
  } catch (error) {
    console.error(
      "Mark payment failed error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Unable to record failed payment.",
    });
  }
};