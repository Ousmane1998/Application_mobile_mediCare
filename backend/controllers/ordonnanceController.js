// controllers/OrdonnanceController.js
import Ordonnance from "../Models/Ordonnance.js";

/**
 * Obtenir toutes les ordonnances
 */
export const getAllOrdonnances = async (req, res) => {
  try {
    const ordonnances = await Ordonnance.find()
      .populate("patient", "nom prenom email")
      .populate("medecin", "nom prenom email");
    res.status(200).json(ordonnances);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des ordonnances", error });
  }
};

/**
 * Créer une ordonnance
 */
export const createOrdonnance = async (req, res) => {
  try {
    const ordonnance = new Ordonnance(req.body);
    await ordonnance.save();
    res.status(201).json(ordonnance);
  } catch (error) {
    res.status(400).json({ message: "Erreur lors de la création", error });
  }
};

/**
 * Supprimer une ordonnance
 */
export const deleteOrdonnance = async (req, res) => {
  try {
    const ordonnance = await Ordonnance.findByIdAndDelete(req.params.id);
    if (!ordonnance) return res.status(404).json({ message: "Ordonnance non trouvée" });
    res.status(200).json({ message: "Ordonnance supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error });
  }
};
