const mongoose = require('mongoose');

const MeasureSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['tension','glycemie','poids','pouls','temperature'], required:true },
  value: { type: String, required: true },
  date: { type: Date, default: Date.now },
  synced: { type: Boolean, default: true }
});
module.exports = mongoose.model('Measure', MeasureSchema);