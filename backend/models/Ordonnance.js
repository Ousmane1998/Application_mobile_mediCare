import mongoose from "mongoose";

const OrdonnanceSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  medecin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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

// Middleware pour normaliser les données AVANT la validation
OrdonnanceSchema.pre('validate', function(next) {
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

// Middleware pour valider les champs requis
OrdonnanceSchema.pre('save', function(next) {
  if (!this.patient) {
    return next(new Error('Patient est requis'));
  }
  if (!this.medecin) {
    return next(new Error('Médecin est requis'));
  }
  if (!this.prescriptions || this.prescriptions.length === 0) {
    return next(new Error('Au moins une prescription est requise'));
  }
  next();
});

const Ordonnance = mongoose.model("Ordonnance", OrdonnanceSchema);

export default Ordonnance;
