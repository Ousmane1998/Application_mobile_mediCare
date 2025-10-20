const mongoose = require('mongoose');

const AvailabilitySchema = new mongoose.Schema({
  medecinId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required:true },
  jour: { type: String }, // e.g., '2025-10-20' or 'Lundi'
  heureDebut: { type: String },
  heureFin: { type: String },
  disponible: { type: Boolean, default: true }
});

module.exports = mongoose.model('Availability', AvailabilitySchema);
