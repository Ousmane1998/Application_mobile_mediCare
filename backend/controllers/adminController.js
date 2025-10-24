// @ts-nocheck
import User from "../models/User.js";

export async function listPendingDoctors(req, res) {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Accès refusé.' });
    const docs = await User.find({ role: 'medecin', archived: true }).select('_id nom prenom email specialite photo');
    return res.json(docs.map(u => ({ id: u._id, nom: u.nom, prenom: u.prenom, email: u.email, specialite: u.specialite, photo: u.photo })));
  } catch (err) {
    return res.status(500).json({ message: 'Erreur lors du chargement.' });
  }
}

export async function activateDoctor(req, res) {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Accès refusé.' });
    const { id } = req.params;
    const user = await User.findOneAndUpdate({ _id: id, role: 'medecin' }, { archived: false }, { new: true });
    if (!user) return res.status(404).json({ message: 'Médecin introuvable.' });
    return res.json({ message: 'Médecin activé avec succès.', user: { id: user._id } });
  } catch (err) {
    return res.status(500).json({ message: "Erreur lors de l'activation." });
  }
}
