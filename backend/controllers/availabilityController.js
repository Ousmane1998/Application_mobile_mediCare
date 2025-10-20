import Availability from "../models/Availability.js";

export const setAvailability = async (req, res) => {
  try {
    const { medecinId, date, heureDebut, heureFin } = req.body;
    const availability = await Availability.create({ medecin: medecinId, date, heureDebut, heureFin });
    res.status(201).json({ message: "Disponibilité enregistrée", availability });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAvailability = async (req, res) => {
  try {
    const { medecinId } = req.query;
    const availability = await Availability.find({ medecin: medecinId });
    res.json(availability);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
