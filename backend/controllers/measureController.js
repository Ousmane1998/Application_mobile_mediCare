// @ts-nocheck
// controllers/measureController.js
import Measure from "../models/Measure.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { emitToUser } from "../utils/sendNotification.js";

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
      data: { measureId: measure._id, gravite: alert.gravite, type, value },
    });
    // Temps réel: notifier le patient
    emitToUser(patientId, "alert", { message: alert.message, measureId: String(measure._id), type, value, gravite: alert.gravite });

    const patient = await User.findById(patientId).lean();
    const medecinId = patient?.medecinId;
    if (medecinId) {
      await Notification.create({
        userId: medecinId,
        type: "alerte",
        message: `${patient.prenom || ''} ${patient.nom || ''}: ${alert.message}`.trim(),
        data: { measureId: measure._id, patientId, type, value, gravite: alert.gravite },
      });
      // Temps réel: notifier le médecin
      emitToUser(medecinId, "alert", { patientId: String(patientId), message: alert.message, measureId: String(measure._id), type, value, gravite: alert.gravite });
    }
  }

  res.status(201).json({ measure });
};

export const getHistory = async (req, res) => {
  const { patientId } = req.params;
  const measures = await Measure.find({ patientId })
    .sort({ date: -1 })
    .limit(100);
  res.json({ measures });
};

export const getById = async (req, res) => {
  const { id } = req.params;
  const m = await Measure.findById(id);
  if (!m) return res.status(404).json({ message: 'Mesure introuvable' });
  res.json({ measure: m });
};
