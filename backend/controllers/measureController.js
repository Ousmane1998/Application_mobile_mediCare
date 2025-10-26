// @ts-nocheck
// controllers/measureController.js
import Measure from "../models/Measure.js";
import Notification from "../models/Notification.js";

export const addMeasure = async (req, res) => {
  try {
    const { patientId, type, value, date } = req.body;
    const userId = req.user?._id; // Du token JWT
    
    console.log("📥 [addMeasure] Données reçues :", { patientId, type, value, date });
    console.log("📥 [addMeasure] userId du token :", userId);
    
    // Utiliser l'ID de l'utilisateur connecté si patientId n'est pas fourni
    const finalPatientId = patientId || userId;
    
    if (!finalPatientId || !type || !value) {
      console.log("❌ [addMeasure] Champs manquants");
      return res.status(400).json({ message: "Missing fields" });
    }

    const measure = await Measure.create({
      patientId: finalPatientId,
      type,
      value,
      date: date || Date.now(),
      synced: true,
    });
    
    console.log("✅ [addMeasure] Mesure créée :", measure._id);

    let alert = null;
    const v = Number(value);

    if (type === "glycemie" && !isNaN(v) && v > 1.4)
      alert = { gravite: "critique", message: "Glycémie élevée" };

    if (type === "pouls" && !isNaN(v) && (v > 120 || v < 40))
      alert = { gravite: "moyenne", message: "Rythme cardiaque anormal" };

    if (type === "tension") {
      const parts = ("" + value).split("/").map(Number);
      if (parts.length === 2 && (parts[0] > 140 || parts[1] > 90))
        alert = { gravite: "critique", message: "Tension élevée" };
    }

    if (alert) {
      await Notification.create({
        userId: finalPatientId,
        type: "alerte",
        message: alert.message,
        data: { measureId: measure._id, gravite: alert.gravite },
      });
    }

    res.status(201).json({ measure });
  } catch (err) {
    console.error("❌ [addMeasure] Erreur :", err.message);
    res.status(500).json({ message: err.message });
  }
};

export const getHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log("📥 [getHistory] Récupération des mesures pour patientId :", patientId);
    console.log("📥 [getHistory] req.params :", req.params);
    console.log("📥 [getHistory] req.query :", req.query);
    
    if (!patientId) {
      console.log("❌ [getHistory] patientId manquant");
      return res.status(400).json({ message: "patientId est requis" });
    }
    
    // Vérifier que patientId est un ObjectId valide
    if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("⚠️ [getHistory] patientId n'est pas un ObjectId valide :", patientId);
      // Continuer quand même, MongoDB gèrera
    }
    
    const measures = await Measure.find({ patientId })
      .sort({ date: -1 })
      .limit(100);
    
    console.log("✅ [getHistory] Mesures trouvées :", measures.length);
    console.log("📊 [getHistory] Détails des mesures :", JSON.stringify(measures, null, 2));
    
    // Retourner un array vide si aucune mesure
    res.json(measures || []);
  } catch (err) {
    console.error("❌ [getHistory] Erreur :", err.message);
    console.error("❌ [getHistory] Stack :", err.stack);
    res.status(500).json({ message: err.message });
  }
};
