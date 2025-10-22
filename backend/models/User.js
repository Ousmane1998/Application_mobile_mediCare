// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String },
  email: { type: String, lowercase: true, index: true },
  telephone: { type: Number, required: true, unique: true },
  adresse: { type: String, trim: true },
  age: { type: Number, min: 0, max: 99 },
  hopital: { type: String, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["patient", "medecin", "admin"], default: "patient" },
  specialite: { type: String },
  archived: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", UserSchema);
export default User;
