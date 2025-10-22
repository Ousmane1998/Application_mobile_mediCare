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
