// models/Appointment.js
import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  medecinId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  heure: { type: String }, // Format: HH:MM
  typeConsultation: { type: String },
  statut: { type: String, enum: ["en_attente", "confirme", "annule"], default: "en_attente" },
  createdAt: { type: Date, default: Date.now },
});

const Appointment = mongoose.model("Appointment", AppointmentSchema);
export default Appointment;
