import mongoose from "mongoose";

const OrdonnanceSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  medecin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  medecinId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  prescriptions: [
    {
      medicament: { type: String, required: true },
      dosage: { type: String },
      frequence: { type: String },
      duree: { type: String },
    },
  ],
  medicaments: [
    {
      nom: { type: String, required: true },
      dosage: { type: String },
      frequence: { type: String },
      duree: { type: String },
    },
  ],
  notes: { type: String },
  measureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Measure",
  },
  dateEmission: { type: Date, default: Date.now },
  fichierPDF: { type: String },
});

// Middleware pour normaliser les données avant la sauvegarde
OrdonnanceSchema.pre('save', function(next) {
  // Utiliser patientId si patient n'est pas défini
  if (!this.patient && this.patientId) {
    this.patient = this.patientId;
  }
  // Utiliser medecinId si medecin n'est pas défini
  if (!this.medecin && this.medecinId) {
    this.medecin = this.medecinId;
  }
  // Convertir medicaments en prescriptions si prescriptions est vide
  if ((!this.prescriptions || this.prescriptions.length === 0) && this.medicaments && this.medicaments.length > 0) {
    this.prescriptions = this.medicaments.map(m => ({
      medicament: m.nom,
      dosage: m.dosage,
      frequence: m.frequence,
      duree: m.duree,
    }));
  }
  next();
});

const Ordonnance = mongoose.model("Ordonnance", OrdonnanceSchema);

export default Ordonnance;
