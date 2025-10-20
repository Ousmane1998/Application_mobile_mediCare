const mongoose = require('mongoose');

const FicheDeSanteSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maladies: [{ type: String }], // ex: ["Hypertension", "Diabète"]
  traitements: [{ type: String }], // ex: ["Metformine 500mg", "Ramipril 10mg"]
  allergies: [{ type: String }],
  antecedents: [{ type: String }],
  groupeSanguin: { type: String },
  derniereMiseAJour: { type: Date, default: Date.now },
});

module.exports = mongoose.model('FicheDeSante', FicheDeSanteSchema);
