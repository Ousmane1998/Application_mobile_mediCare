// @ts-nocheck
// controllers/appointmentController.js
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { emitToUser } from "../utils/sendNotification.js";

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

    // 📬 Créer une notification pour le MÉDECIN (rendez-vous en attente de confirmation)
    try {
      const patient = await User.findById(patientId).select('nom prenom');
      const dateObj = new Date(date);
      const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric' });
      
      const message = `Nouvelle demande de rendez-vous de ${patient?.prenom} ${patient?.nom} pour le ${dateStr}${heure ? ' à ' + heure : ''}`;
      
      await Notification.create({
        userId: medecinId,
        type: 'rdv',
        message: message,
        data: { appointmentId: appointment._id, patientId, status: 'pending' },
        isRead: false,
      });
      
      // 🔔 Émettre l'événement socket au médecin
      emitToUser(medecinId, 'rdv', {
        appointmentId: String(appointment._id),
        patientId: String(patientId),
        message: message,
        date: dateStr,
        heure: heure,
        typeConsultation: typeConsultation,
        status: 'pending'
      });
      
      console.log("✅ [createAppointment] Notification créée pour médecin :", medecinId);
    } catch (notifErr) {
      console.error("⚠️ [createAppointment] Erreur création notification médecin :", notifErr.message);
    }

    // 📬 Créer une notification pour le patient
    try {
      const dateObj = new Date(date);
      const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric' });
      
      await Notification.create({
        userId: patientId,
        type: 'rdv',
        message: `Votre demande de rendez-vous pour le ${dateStr}${heure ? ' à ' + heure : ''} est en attente de confirmation`,
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
    const user = req.user; // from authMiddleware
    const query = {};
    if (user) {
      if (user.role === 'medecin') {
        query.medecinId = user._id;
      } else if (user.role === 'patient') {
        query.patientId = user._id;
      }
    }
    const appointments = await Appointment.find(query).populate("patientId medecinId");
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, date, heure } = req.body;

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ message: 'Rendez-vous non trouvé' });

    // If changing status, enforce that only the assigned doctor can do it
    if (statut) {
      if (!['en_attente', 'confirme', 'annule'].includes(statut)) {
        return res.status(400).json({ message: 'Statut invalide' });
      }
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Non autorisé' });
      const isDoctorOwner = String(user._id) === String(appt.medecinId);
      const isAdmin = user.role === 'admin';
      if (!isDoctorOwner && !isAdmin) {
        return res.status(403).json({ message: 'Seul le médecin peut modifier le statut' });
      }
      appt.statut = statut;
    }
    if (date) appt.date = date;
    if (heure) appt.heure = heure;

    await appt.save();

    console.log('📅 [updateAppointment] Rendez-vous mis à jour :', id, 'Statut :', statut);

    if (statut) {
      try {
        const statusMessages = {
          confirme: 'Votre rendez-vous a été confirmé',
          annule: 'Votre rendez-vous a été annulé',
          en_attente: 'Votre rendez-vous est en attente de confirmation',
        };
        await Notification.create({
          userId: appt.patientId,
          type: 'rdv',
          message: statusMessages[statut] || 'Mise à jour du rendez-vous',
          data: { appointmentId: appt._id, medecinId: appt.medecinId },
          isRead: false,
        });
        console.log('✅ [updateAppointment] Notification créée pour patient :', appt.patientId);
      } catch (notifErr) {
        console.error('⚠️ [updateAppointment] Erreur création notification :', notifErr.message);
      }
    }

    res.status(200).json({ message: 'Rendez-vous mis à jour avec succès', appointment: appt });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
