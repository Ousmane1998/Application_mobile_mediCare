// models/Advice.js
import mongoose from "mongoose";

const AdviceSchema = new mongoose.Schema({
  medecinId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  titre: String,
  contenu: String,
  categorie: String,
  createdAt: { type: Date, default: Date.now },
});

const Advice = mongoose.model("Advice", AdviceSchema);
export default Advice;
