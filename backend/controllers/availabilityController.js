// @ts-nocheck
import Availability from "../models/Availability.js";

export const setAvailability = async (req, res) => {
  try {
    const { medecinId, jour, heureDebut, heureFin, disponible } = req.body;

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
    const { medecinId } = req.query;

    if (!medecinId) {
      return res.status(400).json({ message: "medecinId est requis" });
    }

    const availability = await Availability.find({ medecinId }); // ✅ nom correct
    res.json(availability);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

