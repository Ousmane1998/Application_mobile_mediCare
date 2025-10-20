// models/Structure.js
import mongoose from "mongoose";

const StructureSchema = new mongoose.Schema({
  nom: String,
  lat: Number,
  lng: Number,
  type: { type: String, enum: ["Hopital", "Pharmacie", "Poste de santé"] },
  adresse: String,
  tel: String,
});

const Structure = mongoose.model("Structure", StructureSchema);
export default Structure;
