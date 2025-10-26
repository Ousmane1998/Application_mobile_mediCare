// @ts-nocheck
// controllers/OrdonnanceController.js
import Ordonnance from "../models/Ordonnance.js";
import Notification from "../models/Notification.js";

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

    console.log("💊 [createOrdonnance] Ordonnance créée :", ordonnance._id);

    // 📬 Créer une notification pour le patient
    try {
      const medicaments = ordonnance.medicaments || [];
      const medicamentsList = Array.isArray(medicaments) 
        ? medicaments.map(m => m.nom || m).join(', ')
        : 'Nouveaux médicaments';

      await Notification.create({
        userId: ordonnance.patient,
        type: 'rappel',
        message: `Nouvelle ordonnance: ${medicamentsList}`,
        data: { ordonnanceId: ordonnance._id, medecinId: ordonnance.medecin },
        isRead: false,
      });
      console.log("✅ [createOrdonnance] Notification créée pour patient :", ordonnance.patient);
    } catch (notifErr) {
      console.error("⚠️ [createOrdonnance] Erreur création notification :", notifErr.message);
    }

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
