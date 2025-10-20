const mongoose = require('mongoose');

const OrdonnanceSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medecin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prescriptions: [
    {
      medicament: { type: String, required: true },
      dosage: { type: String },
      frequence: { type: String },
      duree: { type: String }
    }
  ],
  dateEmission: { type: Date, default: Date.now },
  fichierPDF: { type: String }, // chemin du fichier si exporté
});

module.exports = mongoose.model('Ordonnance', OrdonnanceSchema);
