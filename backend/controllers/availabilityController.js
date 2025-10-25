// @ts-nocheck
import Availability from "../models/Availability.js";

export const setAvailability = async (req, res) => {
  try {
    const { jour, heureDebut, heureFin, disponible } = req.body;
    const medecinId = (req.user && (req.user._id || req.user.id)) || req.body.medecinId;

    if (!medecinId) {
      return res.status(400).json({ message: "medecinId est requis (utilisateur authentifié)." });
    }

    const timeRe = /^\d{2}:\d{2}$/;
    if (!jour || !heureDebut || !heureFin) {
      return res.status(400).json({ message: "Champs requis: jour, heureDebut, heureFin." });
    }
    if (!timeRe.test(String(heureDebut)) || !timeRe.test(String(heureFin))) {
      return res.status(400).json({ message: "Format heure invalide (HH:MM)." });
    }
    if (String(heureDebut) >= String(heureFin)) {
      return res.status(400).json({ message: "heureDebut doit être < heureFin." });
    }

    const availability = await Availability.create({
      medecinId,  // ici c'est bien medecinId
      jour,
      heureDebut,
      heureFin,
      disponible: disponible !== undefined ? disponible : true
    });

    res.status(201).json({ message: "Disponibilité enregistrée", availability });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getAvailability = async (req, res) => {
  try {
    let { medecinId } = req.query;
    if (req.user && String(req.user.role) === 'medecin') {
      medecinId = req.user._id || req.user.id;
    }
    if (!medecinId) {
      return res.status(400).json({ message: "medecinId est requis" });
    }
    const availability = await Availability.find({ medecinId });
    res.json(availability);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { jour, heureDebut, heureFin, disponible } = req.body || {};
    const update = {};
    if (jour !== undefined) update.jour = jour;
    if (heureDebut !== undefined) update.heureDebut = heureDebut;
    if (heureFin !== undefined) update.heureFin = heureFin;
    if (disponible !== undefined) update.disponible = disponible;

    let availability = await Availability.findById(id);
    if (!availability) return res.status(404).json({ message: "Disponibilité non trouvée" });
    if (req.user && String(req.user.role) === 'medecin') {
      const owner = String(availability.medecinId);
      const me = String(req.user._id || req.user.id);
      if (owner !== me) return res.status(403).json({ message: "Accès refusé" });
    }
    availability = await Availability.findByIdAndUpdate(id, update, { new: true });
    if (!availability) return res.status(404).json({ message: "Disponibilité non trouvée" });
    res.json({ message: "Disponibilité mise à jour", availability });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Availability.findById(id);
    if (!doc) return res.status(404).json({ message: "Disponibilité non trouvée" });
    if (req.user && String(req.user.role) === 'medecin') {
      const owner = String(doc.medecinId);
      const me = String(req.user._id || req.user.id);
      if (owner !== me) return res.status(403).json({ message: "Accès refusé" });
    }
    const del = await Availability.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ message: "Disponibilité non trouvée" });
    res.json({ message: "Disponibilité supprimée" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

