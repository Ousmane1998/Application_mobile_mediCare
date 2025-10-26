// @ts-nocheck
// controllers/appointmentController.js
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

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

    console.log("📅 [createAppointment] Rendez-vous créé :", appointment._id);

    // 📬 Créer une notification pour le patient
    try {
      const dateObj = new Date(date);
      const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric' });
      
      await Notification.create({
        userId: patientId,
        type: 'rdv',
        message: `Rendez-vous confirmé pour le ${dateStr}${heure ? ' à ' + heure : ''}`,
        data: { appointmentId: appointment._id, medecinId },
        isRead: false,
      });
      console.log("✅ [createAppointment] Notification créée pour patient :", patientId);
    } catch (notifErr) {
      console.error("⚠️ [createAppointment] Erreur création notification :", notifErr.message);
    }

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

    console.log("📅 [updateAppointment] Rendez-vous mis à jour :", id, "Statut :", statut);

    // 📬 Créer une notification si le statut change
    if (statut) {
      try {
        const statusMessages = {
          'confirme': 'Votre rendez-vous a été confirmé',
          'annule': 'Votre rendez-vous a été annulé',
          'en_attente': 'Votre rendez-vous est en attente de confirmation',
        };

        await Notification.create({
          userId: appointment.patientId,
          type: 'rdv',
          message: statusMessages[statut] || 'Mise à jour du rendez-vous',
          data: { appointmentId: appointment._id, medecinId: appointment.medecinId },
          isRead: false,
        });
        console.log("✅ [updateAppointment] Notification créée pour patient :", appointment.patientId);
      } catch (notifErr) {
        console.error("⚠️ [updateAppointment] Erreur création notification :", notifErr.message);
      }
    }

    res.status(200).json({
      message: "Rendez-vous mis à jour avec succès",
      appointment,
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
