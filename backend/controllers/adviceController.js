// controllers/adviceController.js
import Advice from "../models/Advice.js";

export const createAdvice = async (req, res) => {
  try {
    const { medecinId, patientId, titre, contenu, categorie } = req.body;

    if (!medecinId || !patientId) {
      return res.status(400).json({ message: "medecinId et patientId sont obligatoires" });
    }

    const advice = await Advice.create({ medecinId, patientId, titre, contenu, categorie });

    res.status(201).json({ message: "Conseil créé", advice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getAdvice = async (req, res) => {
  try {
    const { patientId } = req.query;
    const advices = await Advice.find()
  .populate('medecinId', 'nom prenom email') // ou les champs que tu veux afficher
  .populate('patientId', 'nom prenom email');

    res.json(advices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
