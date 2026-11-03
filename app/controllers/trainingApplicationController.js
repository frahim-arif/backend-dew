const crypto = require("crypto");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const cloudinary = require("cloudinary").v2;
const TrainingApplication = require("../models/TrainingApplication");
const TrainingBatch = require("../models/TrainingBatch");

const COURSE = "3-Day Hands-On Training in Basic Laparoscopic Surgery & Observership in Advanced Laparoscopy";
const FEE_RUPEES = 15000;
const RESERVATION_MINUTES = 20;
const BATCHES = [
  { batchId: "2026-12", label: "10–12 December 2026", capacity: 6 },
  { batchId: "2027-01", label: "10–12 January 2027", capacity: 6 },
  { batchId: "2027-02", label: "10–12 February 2027", capacity: 6 },
];

function razorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) throw new Error("Razorpay credentials are not configured on the server.");
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}
function cloudinaryReady() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) throw new Error("Secure document storage is not configured.");
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET });
}
function uploadPrivate(file, applicationId, field) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({
      resource_type: "auto", type: "authenticated", access_mode: "authenticated",
      folder: `dewcare/training/${applicationId}`, public_id: field,
      overwrite: true, filename_override: file.originalname,
      context: { original_name: file.originalname },
    }, (err, result) => {
      if (err) return reject(err);
      resolve({ publicId: result.public_id, resourceType: result.resource_type, originalName: file.originalname, format: result.format, bytes: result.bytes });
    }).end(file.buffer);
  });
}
async function releaseExpiredReservations() {
  const expired = await TrainingApplication.find({ paymentStatus: "PENDING", reservationExpiresAt: { $lt: new Date() } }).select("_id batch");
  for (const app of expired) {
    const changed = await TrainingApplication.updateOne({ _id: app._id, paymentStatus: "PENDING" }, { $set: { paymentStatus: "EXPIRED" } });
    if (changed.modifiedCount) await TrainingBatch.updateOne({ batchId: app.batch, reservedSeats: { $gt: 0 } }, { $inc: { reservedSeats: -1 } });
  }
}
async function ensureBatches() {
  for (const b of BATCHES) await TrainingBatch.updateOne({ batchId: b.batchId }, { $setOnInsert: b }, { upsert: true });
}
exports.getBatches = async (req, res) => {
  try {
    await ensureBatches(); await releaseExpiredReservations();
    const rows = await TrainingBatch.find({ active: true }).lean();
    res.json(rows.map(b => ({ id: b.batchId, label: b.label, seats_left: Math.max(0, b.capacity - b.reservedSeats - b.confirmedSeats) })));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createApplication = async (req, res) => {
  let app;
  let seatReserved = false;
  try {
    await ensureBatches(); await releaseExpiredReservations(); cloudinaryReady();
    const body = req.body || {};
    const required = ["batch", "full_name", "gender", "dob", "mobile", "email", "address", "city", "state", "pin", "qualification", "institution", "pg_year", "registration_body", "registration_number"];
    const missing = required.filter(k => !String(body[k] || "").trim());
    if (missing.length) return res.status(400).json({ message: `Required fields missing: ${missing.join(", ")}` });
    if (!/^[6-9]\d{9}$/.test(body.mobile)) return res.status(400).json({ message: "Enter a valid 10-digit mobile number." });
    if (!/^[1-9]\d{5}$/.test(body.pin)) return res.status(400).json({ message: "Enter a valid 6-digit PIN code." });
    if (!["decl_true", "decl_participation", "decl_refund", "decl_consent"].every(k => body[k] === "on" || body[k] === "true")) return res.status(400).json({ message: "Please accept all declarations." });
    const batch = await TrainingBatch.findOneAndUpdate(
      { batchId: body.batch, active: true, $expr: { $lt: [{ $add: ["$reservedSeats", "$confirmedSeats"] }, "$capacity"] } },
      { $inc: { reservedSeats: 1 } }, { new: true }
    );
    if (!batch) return res.status(409).json({ message: "This batch is full. Please select another batch." });
    seatReserved = true;

    const applicationId = `DCH-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const files = {};
    const fileKeys = ["doc_pg_degree", "doc_registration", "doc_photo_id", "doc_photo", "doc_logbook"];
    const incoming = req.files || {};
    for (const key of fileKeys) {
      const file = incoming[key]?.[0];
      if (file) files[key] = await uploadPrivate(file, applicationId, key);
    }
    for (const key of ["doc_pg_degree", "doc_registration", "doc_photo_id", "doc_photo"]) {
      if (!files[key]) throw new Error(`Please upload ${key.replaceAll("_", " ")}.`);
    }
    const payload = {
      applicationId, course: COURSE, batch: body.batch,
      full_name: body.full_name.trim(), gender: body.gender, dob: body.dob,
      mobile: body.mobile, whatsapp: body.whatsapp || "", email: body.email,
      address: body.address, city: body.city, state: body.state, pin: body.pin,
      qualification: body.qualification, qualification_other: body.qualification_other,
      institution: body.institution, pg_year: Number(body.pg_year),
      registration_body: body.registration_body, registration_number: body.registration_number,
      designation: body.designation, workplace: body.workplace,
      theory_level: body.theory_level, cases_assisted: body.cases_assisted,
      cases_performed: body.cases_performed, box_trainer: body.box_trainer,
      previous_courses: body.previous_courses, goals: body.goals,
      accommodation: body.accommodation, arrival_date: body.arrival_date || undefined,
      food_preference: body.food_preference, documents: files,
      declarations: { truthful: true, supervisedParticipation: true, refundPolicy: true, dataConsent: true },
      amount: FEE_RUPEES * 100, paymentStatus: "PENDING",
      reservationExpiresAt: new Date(Date.now() + RESERVATION_MINUTES * 60000),
    };
    app = await TrainingApplication.create(payload);
    const order = await razorpay().orders.create({ amount: FEE_RUPEES * 100, currency: "INR", receipt: applicationId, notes: { application_id: applicationId, batch: body.batch } });
    app.razorpayOrderId = order.id; await app.save();
    res.status(201).json({ application_id: applicationId, order_id: order.id, amount: order.amount, currency: order.currency, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (e) {
    if (app) await TrainingApplication.deleteOne({ _id: app._id }).catch(() => {});
    if (seatReserved) await TrainingBatch.updateOne({ batchId: req.body?.batch, reservedSeats: { $gt: 0 } }, { $inc: { reservedSeats: -1 } }).catch(() => {});
    console.error("Training application/order error:", e);
    res.status(500).json({ message: e.message || "Could not submit training application." });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { application_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (![application_id, razorpay_order_id, razorpay_payment_id, razorpay_signature].every(Boolean)) return res.status(400).json({ message: "Payment verification details are incomplete." });
    const app = await TrainingApplication.findOne({ applicationId: application_id });
    if (!app) return res.status(404).json({ message: "Application not found." });
    if (app.paymentStatus === "PAID") return res.json({ message: "Payment already verified.", application_id: app.applicationId, payment_id: app.razorpayPaymentId });
    if (app.razorpayOrderId !== razorpay_order_id) return res.status(400).json({ message: "Razorpay order does not match this application." });
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    const a = Buffer.from(expected); const b = Buffer.from(razorpay_signature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(400).json({ message: "Invalid payment signature." });
    const payment = await razorpay().payments.fetch(razorpay_payment_id);
    if (payment.order_id !== app.razorpayOrderId || payment.status !== "captured" || payment.amount !== app.amount || payment.currency !== "INR") return res.status(400).json({ message: "Payment is not captured or amount does not match." });
    const updated = await TrainingApplication.findOneAndUpdate({ _id: app._id, paymentStatus: "PENDING" }, { $set: { paymentStatus: "PAID", razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, reservationExpiresAt: null } }, { new: true });
    if (!updated) return res.status(409).json({ message: "Application payment status changed. Contact hospital if amount was debited." });
    await TrainingBatch.updateOne({ batchId: app.batch, reservedSeats: { $gt: 0 } }, { $inc: { reservedSeats: -1, confirmedSeats: 1 } });
    res.json({ message: "Payment verified successfully.", application_id: app.applicationId, payment_id: razorpay_payment_id });
  } catch (e) { console.error("Training payment verification error:", e); res.status(500).json({ message: "Payment verification failed. If money was debited, contact 7086803380 with your Application ID." }); }
};

exports.getApplications = async (req, res) => {
  try { const rows = await TrainingApplication.find().select("-documents -razorpaySignature").sort({ createdAt: -1 }); res.json(rows); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getApplication = async (req, res) => {
  try {
    const app = await TrainingApplication.findById(req.params.id).select("-razorpaySignature");
    if (!app) return res.status(404).json({ message: "Application not found." });
    res.json(app);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
exports.updateApplication = async (req, res) => {
  try {
    const allowed = ["remarks", "status", "designation", "workplace"];
    const update = {};
    for (const key of allowed) if (req.body?.[key] !== undefined) update[key] = req.body[key];
    const app = await TrainingApplication.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select("-razorpaySignature");
    if (!app) return res.status(404).json({ message: "Application not found." });
    res.json(app);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body || {};
    if (!["Pending", "Approved", "Rejected", "Completed"].includes(status)) return res.status(400).json({ message: "Invalid application status." });
    const app = await TrainingApplication.findByIdAndUpdate(req.params.id, { status, ...(remarks !== undefined ? { remarks } : {}) }, { new: true, runValidators: true }).select("-razorpaySignature");
    if (!app) return res.status(404).json({ message: "Application not found." });
    res.json(app);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
exports.deleteApplication = async (req, res) => {
  try {
    const app = await TrainingApplication.findByIdAndDelete(req.params.id);
    if (!app) return res.status(404).json({ message: "Application not found." });
    if (app.paymentStatus === "PAID") await TrainingBatch.updateOne({ batchId: app.batch, confirmedSeats: { $gt: 0 } }, { $inc: { confirmedSeats: -1 } });
    else if (app.paymentStatus === "PENDING") await TrainingBatch.updateOne({ batchId: app.batch, reservedSeats: { $gt: 0 } }, { $inc: { reservedSeats: -1 } });
    res.json({ message: "Application deleted." });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
exports.getStats = async (req, res) => {
  try {
    const [total, pending, approved, rejected, paid] = await Promise.all([
      TrainingApplication.countDocuments(),
      TrainingApplication.countDocuments({ status: "Pending" }),
      TrainingApplication.countDocuments({ status: "Approved" }),
      TrainingApplication.countDocuments({ status: "Rejected" }),
      TrainingApplication.countDocuments({ paymentStatus: "PAID" }),
    ]);
    res.json({ total, pending, approved, rejected, paid });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
