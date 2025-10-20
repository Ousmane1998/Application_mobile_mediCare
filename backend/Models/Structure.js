const mongoose = require('mongoose');

const StructureSchema = new mongoose.Schema({
  nom: String,
  lat: Number,
  lng: Number,
  type: { type: String, enum:['Hopital','Pharmacie','Poste de santé'] },
  adresse: String,
  tel: String
});
module.exports = mongoose.model('Structure', StructureSchema);
