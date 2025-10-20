// models/Availability.js
import mongoose from "mongoose";

const AvailabilitySchema = new mongoose.Schema({
  medecinId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  jour: { type: String },
  heureDebut: { type: String },
  heureFin: { type: String },
  disponible: { type: Boolean, default: true },
});

const Availability = mongoose.model("Availability", AvailabilitySchema);
export default Availability;
