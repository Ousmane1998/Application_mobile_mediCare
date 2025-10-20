const mongoose = require('mongoose');

const AdviceSchema = new mongoose.Schema({
  medecinId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required:true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required:true },
  titre: String,
  contenu: String,
  categorie: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Advice', AdviceSchema);
