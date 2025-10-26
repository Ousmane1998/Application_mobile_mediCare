// @ts-nocheck
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
    console.log("📥 [getAdvice] Récupération des conseils pour patientId :", patientId);
    
    if (!patientId) {
      console.log("❌ [getAdvice] patientId manquant");
      return res.status(400).json({ message: "patientId est requis" });
    }
    
    // ✅ Filtrer par patientId
    const advices = await Advice.find({ patientId })
      .populate('medecinId', 'nom prenom email')
      .populate('patientId', 'nom prenom email')
      .sort({ createdAt: -1 });

    console.log("✅ [getAdvice] Conseils trouvés :", advices.length);
    res.json(advices);
  } catch (err) {
    console.error("❌ [getAdvice] Erreur :", err.message);
    res.status(500).json({ message: err.message });
  }
};
