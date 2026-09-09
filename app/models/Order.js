const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    courseId: String,
    paymentStatus: { type: String, default: "pending" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
