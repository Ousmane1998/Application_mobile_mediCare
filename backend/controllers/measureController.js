// @ts-nocheck
// controllers/measureController.js
import Measure from "../models/Measure.js";
import Notification from "../models/Notification.js";

export const addMeasure = async (req, res) => {
  const { patientId, type, value, date } = req.body;
  if (!patientId || !type || !value)
    return res.status(400).json({ message: "Missing fields" });

  const measure = await Measure.create({
    patientId,
    type,
    value,
    date: date || Date.now(),
    synced: true,
  });

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
      userId: patientId,
      type: "alerte",
      message: alert.message,
      data: { measureId: measure._id, gravite: alert.gravite },
    });
  }

  res.status(201).json({ measure });
};

export const getHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log("📥 [getHistory] Récupération des mesures pour patientId :", patientId);
    
    const measures = await Measure.find({ patientId })
      .sort({ date: -1 })
      .limit(100);
    
    console.log("✅ [getHistory] Mesures trouvées :", measures.length);
    res.json(measures);  // ✅ Retourner directement l'array
  } catch (err) {
    console.error("❌ [getHistory] Erreur :", err.message);
    res.status(500).json({ message: err.message });
  }
};
