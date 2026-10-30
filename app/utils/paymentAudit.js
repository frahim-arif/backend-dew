
const PaymentAuditLog = require("../models/PaymentAuditLog");

const writePaymentAudit = async ({
  appointmentId = null,
  event,
  orderId = "",
  paymentId = "",
  amountPaise = null,
  currency = "INR",
  status = "REQUESTED",
  request = null,
  response = null,
  verification = null,
  error = "",
}) => {
  try {
    await PaymentAuditLog.create({
      appointmentId,
      event,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      amountPaise,
      currency,
      status,
      request,
      response,
      verification,
      error: error
        ? String(error).slice(0, 1000)
        : "",
    });

    console.log(
      `[PAYMENT AUDIT] ${event} - ${status}`
    );

    return true;
  } catch (auditError) {
    // Audit logging failure must not break payment flow.
    console.error(
      "[PAYMENT AUDIT DATABASE ERROR]",
      auditError.message
    );

    return false;
  }
};

module.exports = {
  writePaymentAudit,
};
