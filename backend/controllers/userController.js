// @ts-nocheck
import User from "../models/User.js";

// Lister tous les utilisateurs
export const listUsers = async (req, res) => {
  try {
    const users = await User.find({ archived: { $ne: true } });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lister les patients du médecin connecté
export const listMyPatients = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'medecin') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const patients = await User.find({ role: 'patient', medecinId: req.user._id, archived: { $ne: true } });
    res.status(200).json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lister les patients
export const listPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: "patient", archived: { $ne: true } });
    res.status(200).json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lister les médecins
export const listMedecins = async (req, res) => {
  try {
    const medecins = await User.find({ role: "medecin", archived: { $ne: true } });
    res.status(200).json(medecins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Modifier un utilisateur
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedUser) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Archiver un utilisateur
export const archiveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const archivedUser = await User.findByIdAndUpdate(id, { archived: true }, { new: true });
    if (!archivedUser) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.status(200).json({ message: "Utilisateur archivé", user: archivedUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const total = await User.countDocuments({ archived: { $ne: true } });
    const patients = await User.countDocuments({ role: "patient", archived: { $ne: true } });
    const medecins = await User.countDocuments({ role: "medecin", archived: { $ne: true } });
    const admins = await User.countDocuments({ role: "admin", archived: { $ne: true } });
    res.status(200).json({ total, patients, medecins, admins });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};
    if (!role || !["patient", "medecin", "admin"].includes(String(role))) {
      return res.status(400).json({ message: "Rôle invalide" });
    }
    const updated = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!updated) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.status(200).json({ message: "Utilisateur supprimé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
