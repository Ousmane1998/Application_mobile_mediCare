const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required:true },
  medecinId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required:true },
  date: { type: Date, required:true },
  heure: { type: String },
  statut: { type: String, enum:['en_attente','confirme','annule'], default:'en_attente' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
