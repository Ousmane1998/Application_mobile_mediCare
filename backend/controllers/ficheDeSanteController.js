// @ts-nocheck
// controllers/FicheDeSanteController.js
import FicheDeSante from "../models/FicheDeSante.js";
import User from "../models/User.js";

/**
 * Obtenir toutes les fiches de santé
 */
export const getAllFiches = async (req, res) => {
  try {
    const user = req.user;
    let query = {};
    if (user) {
      if (user.role === 'patient') {
        query = { patient: user._id };
      } else if (user.role === 'medecin') {
        // Fetch patients of this doctor
        const patients = await User.find({ medecinId: user._id }).select('_id');
        const ids = patients.map(p => p._id);
        query = { patient: { $in: ids } };
      }
    }
    const fiches = await FicheDeSante.find(query).populate("patient", "nom prenom email medecinId");
    res.status(200).json(fiches);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des fiches", error });
  }
};

/**
 * Créer une fiche de santé
 */
export const createFiche = async (req, res) => {
  try {
    const user = req.user;
    const body = req.body || {};
    const patientId = body.patient;
    if (!patientId) return res.status(400).json({ message: 'patient requis' });
    if (!user) return res.status(401).json({ message: 'Non authentifié' });
    if (user.role === 'patient' && String(patientId) !== String(user._id)) {
      return res.status(403).json({ message: 'Interdit' });
    }
    if (user.role === 'medecin') {
      const patient = await User.findById(patientId).select('medecinId');
      if (!patient) return res.status(404).json({ message: 'Patient introuvable' });
      if (String(patient.medecinId) !== String(user._id)) return res.status(403).json({ message: 'Interdit' });
    }
    const fiche = new FicheDeSante(body);
    await fiche.save();
    res.status(201).json(fiche);
  } catch (error) {
    res.status(400).json({ message: "Erreur lors de la création de la fiche", error });
  }
};

/**
 * Mettre à jour une fiche de santé
 */
export const updateFiche = async (req, res) => {
  try {
    const user = req.user;
    const fiche = await FicheDeSante.findById(req.params.id);
    if (!fiche) return res.status(404).json({ message: "Fiche non trouvée" });
    if (!user) return res.status(401).json({ message: 'Non authentifié' });
    if (user.role === 'patient' && String(fiche.patient) !== String(user._id)) return res.status(403).json({ message: 'Interdit' });
    if (user.role === 'medecin') {
      const patient = await User.findById(fiche.patient).select('medecinId');
      if (!patient || String(patient.medecinId) !== String(user._id)) return res.status(403).json({ message: 'Interdit' });
    }
    Object.assign(fiche, req.body || {});
    await fiche.save();
    res.status(200).json(fiche);
  } catch (error) {
    res.status(400).json({ message: "Erreur lors de la mise à jour", error });
  }
};

/**
 * Supprimer une fiche de santé
 */
export const deleteFiche = async (req, res) => {
  try {
    const user = req.user;
    const fiche = await FicheDeSante.findById(req.params.id);
    if (!fiche) return res.status(404).json({ message: "Fiche non trouvée" });
    if (!user) return res.status(401).json({ message: 'Non authentifié' });
    if (user.role === 'patient' && String(fiche.patient) !== String(user._id)) return res.status(403).json({ message: 'Interdit' });
    if (user.role === 'medecin') {
      const patient = await User.findById(fiche.patient).select('medecinId');
      if (!patient || String(patient.medecinId) !== String(user._id)) return res.status(403).json({ message: 'Interdit' });
    }
    await fiche.deleteOne();
    res.status(200).json({ message: "Fiche supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error });
  }
};
