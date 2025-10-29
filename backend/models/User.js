// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  photo: { type: String, default: "", trim: true },
  email: { type: String, lowercase: true, required: true, unique: true, index: true },
  telephone: { type: Number, required: true, unique: true },
  adresse: { type: String, trim: true },
  age: { type: Number, min: 0, max: 99 },
  hopital: { type: String, default: "", trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["patient", "medecin", "admin"],  required: true, index: true },
  specialite: { type: String, default: "" },
  medecinId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  pathologie: { type: String, default: "" },
  archived: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'active', 'disabled'], default: 'pending', index: true },

  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", UserSchema);
export default User;
