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
    // Récupérer patientId depuis les params ou query
    const patientId = req.params.patientId || req.query.patientId;
    console.log("📥 [getAdvice] Récupération des conseils pour patientId :", patientId);
    console.log("📥 [getAdvice] req.params :", req.params);
    console.log("📥 [getAdvice] req.query :", req.query);
    
    if (!patientId) {
      console.log("❌ [getAdvice] patientId manquant");
      return res.status(400).json({ message: "patientId est requis" });
    }
    
    // Vérifier que patientId est un ObjectId valide
    if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("⚠️ [getAdvice] patientId n'est pas un ObjectId valide :", patientId);
    }
    
    // ✅ Filtrer par patientId
    const advices = await Advice.find({ patientId })
      .populate('medecinId', 'nom prenom email')
      .populate('patientId', 'nom prenom email')
      .sort({ createdAt: -1 });

    console.log("✅ [getAdvice] Conseils trouvés :", advices.length);
    console.log("📋 [getAdvice] Détails des conseils :", JSON.stringify(advices, null, 2));
    
    res.json(advices || []);
  } catch (err) {
    console.error("❌ [getAdvice] Erreur :", err.message);
    console.error("❌ [getAdvice] Stack :", err.stack);
    res.status(500).json({ message: err.message });
  }
};
