// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String },
  email: { type: String, lowercase: true, index: true },
  telephone: { type: String, required: true, unique: true },
  adresse: { type: String, trim: true },
  age: { type: Number, min: 0 },
  hopital: { type: String, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["patient", "medecin", "admin"], default: "patient" },
  specialite: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", UserSchema);
export default User;
