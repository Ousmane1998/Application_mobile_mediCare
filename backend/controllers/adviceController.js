// controllers/adviceController.js
import Advice from "../models/Advice.js";

export const createAdvice = async (req, res) => {
  try {
    const { medecinId, patientId, contenu } = req.body;
    const advice = await Advice.create({ medecin: medecinId, patient: patientId, contenu });
    res.status(201).json({ message: "Conseil envoyé", advice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAdvice = async (req, res) => {
  try {
    const { patientId } = req.query;
    const advices = await Advice.find({ patient: patientId }).populate("medecin", "nom prenom specialite");
    res.json(advices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
