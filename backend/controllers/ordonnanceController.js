// @ts-nocheck
// controllers/OrdonnanceController.js
import Ordonnance from "../models/Ordonnance.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

/**
 * Obtenir toutes les ordonnances
 */
export const getAllOrdonnances = async (req, res) => {
  try {
    const user = req.user;
    let query = {};
    if (user) {
      if (user.role === 'patient') {
        query = { patient: user._id };
      } else if (user.role === 'medecin') {
        // Le médecin voit ses ordonnances ou celles de ses patients traités
        const patients = await User.find({ medecinId: user._id }).select('_id');
        const ids = patients.map(p => p._id);
        query = { $or: [ { medecin: user._id }, { patient: { $in: ids } } ] };
      }
    }
    const ordonnances = await Ordonnance.find(query)
      .populate("patient", "nom prenom email medecinId")
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
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Non authentifié' });
    if (user.role !== 'medecin' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Seul un médecin peut créer une ordonnance' });
    }
    const body = req.body || {};
    if (!body.patient || !body.medecin) return res.status(400).json({ message: 'patient et medecin requis' });
    if (user.role === 'medecin' && String(body.medecin) !== String(user._id)) {
      return res.status(403).json({ message: 'medecin doit être l’utilisateur connecté' });
    }
    // Vérifier que le patient est bien rattaché à ce médecin (traitant)
    const patient = await User.findById(body.patient).select('medecinId');
    if (!patient) return res.status(404).json({ message: 'Patient introuvable' });
    if (user.role === 'medecin' && String(patient.medecinId) !== String(user._id)) {
      return res.status(403).json({ message: 'Patient non rattaché à ce médecin' });
    }
    const ordonnance = new Ordonnance(body);
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
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Non authentifié' });
    const ordonnance = await Ordonnance.findById(req.params.id);
    if (!ordonnance) return res.status(404).json({ message: "Ordonnance non trouvée" });
    const isAuthor = String(ordonnance.medecin) === String(user._id);
    const isAdmin = user.role === 'admin';
    if (!isAuthor && !isAdmin) return res.status(403).json({ message: 'Seul le médecin auteur peut supprimer' });
    await ordonnance.deleteOne();
    res.status(200).json({ message: "Ordonnance supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error });
  }
};
