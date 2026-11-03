const mongoose = require("mongoose");

const trainingBatchSchema = new mongoose.Schema({
  batchId: { type: String, required: true, unique: true, index: true },
  label: { type: String, required: true },
  capacity: { type: Number, default: 6, min: 1 },
  reservedSeats: { type: Number, default: 0, min: 0 },
  confirmedSeats: { type: Number, default: 0, min: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.models.TrainingBatch || mongoose.model("TrainingBatch", trainingBatchSchema);
