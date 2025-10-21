import mongoose from "mongoose";

const FicheDeSanteSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  maladies: [{ type: String }], // ex: ["Hypertension", "Diabète"]
  traitements: [{ type: String }], // ex: ["Metformine 500mg", "Ramipril 10mg"]
  allergies: [{ type: String }],
  antecedents: [{ type: String }],
  groupeSanguin: { type: String },
  derniereMiseAJour: { type: Date, default: Date.now },
});

const FicheDeSante = mongoose.model("FicheDeSante", FicheDeSanteSchema);

export default FicheDeSante;
