// controllers/FicheDeSanteController.js
import FicheDeSante from "../models/FicheDeSante.js";

/**
 * Obtenir toutes les fiches de santé
 */
export const getAllFiches = async (req, res) => {
  try {
    const fiches = await FicheDeSante.find().populate("patient", "nom prenom email");
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
    const fiche = new FicheDeSante(req.body);
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
    const fiche = await FicheDeSante.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!fiche) return res.status(404).json({ message: "Fiche non trouvée" });
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
    const fiche = await FicheDeSante.findByIdAndDelete(req.params.id);
    if (!fiche) return res.status(404).json({ message: "Fiche non trouvée" });
    res.status(200).json({ message: "Fiche supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error });
  }
};
