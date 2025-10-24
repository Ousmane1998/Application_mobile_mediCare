// controllers/appointmentController.js
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";

export const createAppointment = async (req, res) => {
  try {
    const { patientId, medecinId, date, heure, typeConsultation } = req.body;
      // vérif basique
    if (!patientId || !medecinId || !date) {
      return res.status(400).json({ message: "Champs requis manquants." });
    }
    const appointment = await Appointment.create({
      patientId,
      medecinId,
      date,
      heure,
      typeConsultation,
      statut: "en_attente",
    });
    res.status(201).json({ message: "Rendez-vous créé", appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().populate("patientId medecinId");
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, date, heure } = req.body;

    const updateData = {};
    if (statut) {
      if (!["en_attente", "confirme", "annule"].includes(statut)) {
        return res.status(400).json({ message: "Statut invalide" });
      }
      updateData.statut = statut;
    }
    if (date) updateData.date = date;
    if (heure) updateData.heure = heure;

    const appointment = await Appointment.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous non trouvé" });
    }

    res.status(200).json({
      message: "Rendez-vous mis à jour avec succès",
      appointment,
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
